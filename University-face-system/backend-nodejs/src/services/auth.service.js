const bcrypt = require("bcryptjs");
const axios = require("axios");
const db = require("../config/db");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../utils/jwt");
const { generateRandomToken, generateOTP, hashToken } = require("../utils/otp");
const { 
    sendVerificationEmail, 
    sendPasswordResetEmail, 
    sendAdminApprovalRequestEmail, 
    sendTeacherApprovedEmail, 
    sendTeacherRejectedEmail 
} = require("./email.service");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const signup = async ({ full_name, email, password, role = 'teacher' }) => {
    email = email.toLowerCase().trim();

    // Check if email already exists
    const [existingUsers] = await db.execute("SELECT id FROM administrators WHERE email = ?", [email]);
    if (existingUsers.length > 0) {
        throw new Error("Email đã được đăng ký");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = generateRandomToken(32);
    const approvalToken = generateRandomToken(32);
    
    const expiresInMinutes = Number(process.env.EMAIL_VERIFY_EXPIRES_MINUTES) || 15;
    const expiresDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
    const isApproved = role === 'admin' ? 1 : 0;
    const approvalTokenHash = isApproved ? null : hashToken(approvalToken);

    // Insert new user
    const [result] = await db.execute(
        `INSERT INTO administrators 
         (username, full_name, email, password, role, is_email_verified, email_verify_token, email_verify_expires, is_approved, approval_token) 
         VALUES (?, ?, ?, ?, ?, 1, NULL, NULL, ?, ?)`,
        [username, full_name, email, passwordHash, role, isApproved, approvalTokenHash]
    );

    const newUserId = result.insertId;

    if (role === 'teacher') {
        try {
            await sendAdminApprovalRequestEmail({ id: newUserId, username, full_name, email }, approvalToken);
        } catch (error) {
            console.error("Lỗi khi gửi email duyệt tài khoản tới Admin:", error.message);
        }
    }

    return {
        id: newUserId,
        full_name,
        email,
        is_approved: isApproved
    };
};

const verifyEmail = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id, email_verify_expires FROM administrators WHERE email_verify_token = ?",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token xác thực không hợp lệ");
    }

    const user = users[0];
    if (user.email_verify_expires && new Date(user.email_verify_expires).getTime() < Date.now()) {
        throw new Error("Token xác thực đã hết hạn");
    }

    const userId = user.id;

    // Update verified status
    await db.execute(
        `UPDATE administrators 
         SET is_email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL 
         WHERE id = ?`,
        [userId]
    );

    return true;
};

const signin = async ({ email, password }) => {
    email = email.toLowerCase().trim();

    const [users] = await db.execute(
        "SELECT * FROM administrators WHERE email = ?",
        [email]
    );

    if (users.length === 0) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    const user = users[0];

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
        throw new Error("Email hoặc mật khẩu không đúng");
    }

    if (user.role === 'teacher' && user.is_approved === 0) {
        throw new Error("Tài khoản Giảng viên của bạn đang chờ Admin duyệt. Vui lòng kiểm tra email hoặc liên hệ Admin.");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await db.execute(
        "UPDATE administrators SET refresh_token_hash = ?, last_login_at = NOW() WHERE id = ?",
        [refreshTokenHash, user.id]
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        },
    };
};

const refreshToken = async (token) => {
    if (!token) {
        throw new Error("Refresh token không tồn tại");
    }

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        throw new Error("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    if (payload.type !== "refresh") {
        throw new Error("Token không hợp lệ");
    }

    const [users] = await db.execute(
        "SELECT id, full_name, email, role, refresh_token_hash FROM administrators WHERE id = ?",
        [payload.sub]
    );

    if (users.length === 0) {
        throw new Error("Người dùng không tồn tại");
    }

    const user = users[0];

    if (!user.refresh_token_hash) {
        throw new Error("Refresh token không hợp lệ");
    }

    const matched = await bcrypt.compare(token, user.refresh_token_hash);
    if (!matched) {
        throw new Error("Refresh token không hợp lệ");
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

    await db.execute(
        "UPDATE administrators SET refresh_token_hash = ? WHERE id = ?",
        [newRefreshTokenHash, user.id]
    );

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};

const signout = async (userId) => {
    await db.execute(
        "UPDATE administrators SET refresh_token_hash = NULL WHERE id = ?",
        [userId]
    );
    return true;
};

const forgotPassword = async (email) => {
    email = email.toLowerCase().trim();

    const [users] = await db.execute("SELECT id, full_name FROM administrators WHERE email = ?", [email]);
    if (users.length === 0) {
        // Return true anyway to prevent email enumeration
        return true;
    }

    const user = users[0];
    const resetToken = generateOTP();
    
    const expiresInMinutes = Number(process.env.RESET_PASSWORD_EXPIRES_MINUTES) || 15;
    const expiresDate = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.execute(
        "UPDATE administrators SET password_reset_token_hash = ?, password_reset_expires = ? WHERE id = ?",
        [hashToken(resetToken), expiresDate, user.id]
    );

    try {
        await sendPasswordResetEmail(email, user.full_name, resetToken);
    } catch (error) {
        console.error("Lỗi khi gửi email reset password:", error.message);
    }

    return true;
};

const verifyForgotPassword = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE password_reset_token_hash = ? AND password_reset_expires > NOW()",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    return true;
};

const resetPassword = async (token, newPassword) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE password_reset_token_hash = ? AND password_reset_expires > NOW()",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token không hợp lệ hoặc đã hết hạn");
    }

    const userId = users[0].id;
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db.execute(
        `UPDATE administrators 
         SET password = ?, password_reset_token_hash = NULL, password_reset_expires = NULL, refresh_token_hash = NULL 
         WHERE id = ?`,
        [passwordHash, userId]
    );

    return true;
};

const getMe = async (userId) => {
    const [users] = await db.execute(
        "SELECT id, email, username, full_name, role, is_email_verified, last_login_at, created_at FROM administrators WHERE id = ?",
        [userId]
    );

    if (users.length === 0) {
        throw new Error("Người dùng không tồn tại");
    }

    return users[0];
};

const signinByFace = async (adminId) => {
    const [users] = await db.execute(
        "SELECT id, full_name, email, role, is_email_verified FROM administrators WHERE id = ?",
        [adminId]
    );

    if (users.length === 0) {
        throw new Error("Tài khoản không tồn tại");
    }

    const user = users[0];

    if (!user.is_email_verified) {
        throw new Error("Tài khoản chưa xác thực email");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await db.execute(
        "UPDATE administrators SET refresh_token_hash = ?, last_login_at = NOW() WHERE id = ?",
        [refreshTokenHash, user.id]
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
        },
    };
};

const registerAdminFace = async (adminId, imageStraight, imageLeft, imageRight) => {
    // Verify admin exists
    const [users] = await db.execute(
        "SELECT id FROM administrators WHERE id = ?",
        [adminId]
    );
    if (users.length === 0) {
        throw new Error("Tài khoản không tồn tại");
    }

    // Call Python AI service to register face
    const response = await axios.post(`${AI_SERVICE_URL}/api/v1/admin/register_face`, {
        admin_id: adminId,
        image_straight: imageStraight,
        image_left: imageLeft,
        image_right: imageRight,
    });

    if (!response.data.success) {
        throw new Error("Không thể đăng ký khuôn mặt. Vui lòng thử lại.");
    }

    return true;
};

const approveTeacher = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id, full_name, email, is_approved FROM administrators WHERE approval_token = ?",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token phê duyệt không hợp lệ hoặc tài khoản đã được xử lý trước đó.");
    }

    const user = users[0];
    if (user.is_approved === 1) {
        return { message: `Tài khoản ${user.full_name} đã được phê duyệt từ trước.`, user };
    }

    await db.execute(
        "UPDATE administrators SET is_approved = 1, is_email_verified = 1, approval_token = NULL WHERE id = ?",
        [user.id]
    );

    try {
        await sendTeacherApprovedEmail(user.email, user.full_name);
    } catch (e) {
        console.error("Lỗi gửi email thông báo duyệt cho Giảng viên:", e.message);
    }

    return { message: `Đã phê duyệt tài khoản Giảng viên ${user.full_name} thành công.`, user };
};

const rejectTeacher = async (token) => {
    const tokenHash = hashToken(token);

    const [users] = await db.execute(
        "SELECT id, full_name, email FROM administrators WHERE approval_token = ?",
        [tokenHash]
    );

    if (users.length === 0) {
        throw new Error("Token từ chối không hợp lệ hoặc tài khoản đã được xử lý.");
    }

    const user = users[0];

    await db.execute("DELETE FROM administrators WHERE id = ?", [user.id]);

    try {
        await sendTeacherRejectedEmail(user.email, user.full_name);
    } catch (e) {
        console.error("Lỗi gửi email từ chối cho Giảng viên:", e.message);
    }

    return { message: `Đã từ chối và xóa tài khoản Giảng viên ${user.full_name}.`, user };
};

module.exports = {
    signup,
    verifyEmail,
    signin,
    signinByFace,
    registerAdminFace,
    refreshToken,
    signout,
    forgotPassword,
    verifyForgotPassword,
    resetPassword,
    getMe,
    approveTeacher,
    rejectTeacher,
};
