const authService = require("../services/auth.service");
const axios = require("axios");

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const signup = async (req, res, next) => {
    try {
        const result = await authService.signup(req.body);
        res.status(201).json({
            success: true,
            message: "Đăng ký thành công. Vui lòng kiểm tra email để xác thực.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        await authService.verifyEmail(req.body.token);
        res.status(200).json({
            success: true,
            message: "Xác thực email thành công",
            data: { valid: true },
        });
    } catch (error) {
        next(error);
    }
};

const signin = async (req, res, next) => {
    try {
        const result = await authService.signin(req.body);
        res.status(200).json({
            success: true,
            message: "Đăng nhập thành công",
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const token = req.body.refreshToken || req.body.refresh_token;
        const result = await authService.refreshToken(token);
        res.status(200).json({
            success: true,
            message: "Refresh token thành công",
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const signout = async (req, res, next) => {
    try {
        await authService.signout(req.user.sub);
        res.status(200).json({
            success: true,
            message: "Đăng xuất thành công",
        });
    } catch (error) {
        next(error);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.status(200).json({
            success: true,
            message: "Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.",
        });
    } catch (error) {
        next(error);
    }
};

const verifyForgotPassword = async (req, res, next) => {
    try {
        await authService.verifyForgotPassword(req.body.token);
        res.status(200).json({
            success: true,
            message: "Token hợp lệ",
            data: { valid: true },
        });
    } catch (error) {
        next(error);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        await authService.resetPassword(token, newPassword);
        res.status(200).json({
            success: true,
            message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.",
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getMe(req.user.sub);
        res.status(200).json({
            success: true,
            message: "Lấy thông tin người dùng thành công",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const faceLogin = async (req, res, next) => {
    try {
        const { image_base64 } = req.body;
        if (!image_base64) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp ảnh khuôn mặt" });
        }

        // Call Python AI service to identify face
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/v1/admin/identify`, {
            image_base64,
        });

        const aiData = aiResponse.data;

        if (!aiData.match || !aiData.admin_id) {
            return res.status(401).json({
                success: false,
                message: "Không nhận diện được khuôn mặt. Vui lòng thử lại.",
                confidence: aiData.confidence || 0,
            });
        }

        // Generate JWT for the identified admin
        const result = await authService.signinByFace(aiData.admin_id);

        res.status(200).json({
            success: true,
            message: `Xác nhận khuôn mặt thành công`,
            access_token: result.accessToken,
            refresh_token: result.refreshToken,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const registerAdminFace = async (req, res, next) => {
    try {
        const { image_straight, image_left, image_right } = req.body;
        const adminId = req.user.sub;

        if (!image_straight || !image_left || !image_right) {
            return res.status(400).json({ success: false, message: "Cần ảnh cả 3 góc: thẳng, trái, phải" });
        }

        await authService.registerAdminFace(adminId, image_straight, image_left, image_right);

        res.status(200).json({
            success: true,
            message: "Đăng ký khuôn mặt thành công",
        });
    } catch (error) {
        next(error);
    }
};

const approveTeacher = async (req, res, next) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).send("<h1>Thiếu token phê duyệt</h1>");
        }
        const result = await authService.approveTeacher(token);
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

        return res.send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Phê duyệt thành công</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; max-width: 440px; border: 1px solid #e2e8f0; }
                    .icon { width: 72px; height: 72px; background: #d1fae5; color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; font-weight: bold; }
                    h2 { color: #0f172a; margin: 0 0 10px; font-size: 22px; }
                    p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
                    a { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">✓</div>
                    <h2>Phê Duyệt Thành Công!</h2>
                    <p>${result.message}</p>
                    <a href="${clientUrl}">Truy cập Trang chủ Hệ thống</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head><meta charset="UTF-8"><title>Lỗi phê duyệt</title>
            <style>
                body { font-family: sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                .card { background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 440px; border: 1px solid #fee2e2; }
                .icon { width: 72px; height: 72px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; }
                h2 { color: #991b1b; } p { color: #64748b; }
            </style></head>
            <body>
                <div class="card">
                    <div class="icon">✕</div>
                    <h2>Thông báo</h2>
                    <p>${error.message || 'Token phê duyệt không hợp lệ hoặc đã hết hạn.'}</p>
                </div>
            </body>
            </html>
        `);
    }
};

const rejectTeacher = async (req, res, next) => {
    try {
        const token = req.query.token;
        if (!token) {
            return res.status(400).send("<h1>Thiếu token từ chối</h1>");
        }
        const result = await authService.rejectTeacher(token);
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

        return res.send(`
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Đã từ chối tài khoản</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); text-align: center; max-width: 440px; border: 1px solid #e2e8f0; }
                    .icon { width: 72px; height: 72px; background: #fee2e2; color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 36px; font-weight: bold; }
                    h2 { color: #0f172a; margin: 0 0 10px; font-size: 22px; }
                    p { color: #64748b; font-size: 14px; line-height: 1.5; margin: 0 0 24px; }
                    a { background: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block; font-size: 14px; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">✕</div>
                    <h2>Đã Từ Chối Đăng Ký</h2>
                    <p>${result.message}</p>
                    <a href="${clientUrl}">Truy cập Trang chủ</a>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        return res.status(400).send(`<h1>Lỗi: ${error.message}</h1>`);
    }
};

module.exports = {
    signup,
    verifyEmail,
    signin,
    faceLogin,
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
