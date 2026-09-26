const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
    },
});

const sendVerificationEmail = async (email, name, token) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify-email?token=${token}`;

    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Xác thực tài khoản",
        html: `
            <h2>Xin chào ${name},</h2>
            <p>Cảm ơn bạn đã đăng ký tài khoản.</p>
            <p>Vui lòng click vào link bên dưới để xác thực email:</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Xác thực email</a>
            <p>Link có hiệu lực trong ${process.env.EMAIL_VERIFY_EXPIRES_MINUTES || 15} phút.</p>
        `,
    });
};

const sendPasswordResetEmail = async (email, name, otpCode) => {
    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Mã xác nhận đặt lại mật khẩu: ${otpCode}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #175b9f 0%, #1a73c7 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">🔐 Đặt lại mật khẩu</h1>
                    <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 0;">Hệ thống Điểm danh Khuôn mặt</p>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 8px 0;">Xin chào <strong>${name}</strong>,</p>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác nhận bên dưới:
                    </p>
                    <div style="background: #f8fafc; border: 2px dashed #175b9f; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                        <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0; font-weight: 600;">Mã xác nhận của bạn</p>
                        <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #175b9f; font-family: 'Courier New', monospace;">${otpCode}</div>
                    </div>
                    <div style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
                        <p style="color: #92400e; font-size: 12px; margin: 0; font-weight: 500;">
                            ⏱️ Mã có hiệu lực trong <strong>${process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15} phút</strong>. Không chia sẻ mã này với bất kỳ ai.
                        </p>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5;">
                        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 Hệ thống Điểm danh Khuôn mặt - NTU</p>
                </div>
            </div>
        `,
    });
};

const sendAdminApprovalRequestEmail = async (teacherInfo, approvalToken) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const approveUrl = `${backendUrl}/api/auth/approve-teacher?token=${approvalToken}`;
    const rejectUrl = `${backendUrl}/api/auth/reject-teacher?token=${approvalToken}`;

    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔔 [Yêu cầu Duyệt] Đăng ký tài khoản Giảng viên mới: ${teacherInfo.full_name}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 540px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">🔔 Yêu cầu Phê duyệt Tài khoản Giảng viên</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 0;">Hệ thống Điểm danh Khuôn mặt AI</p>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0;">Xin chào <strong>Quản trị viên (Admin)</strong>,</p>
                    <p style="color: #64748b; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
                        Hệ thống vừa nhận được một yêu cầu đăng ký tài khoản Giảng viên mới. Dưới đây là thông tin chi tiết:
                    </p>
                    
                    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 20px; margin: 0 0 24px 0;">
                        <table style="width: 100%; text-align: left; border-collapse: collapse; font-size: 14px;">
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 140px;">Họ và Tên:</td>
                                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${teacherInfo.full_name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email Giảng viên:</td>
                                <td style="padding: 8px 0; color: #2563eb; font-weight: 700;">${teacherInfo.email}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Tên tài khoản:</td>
                                <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${teacherInfo.username}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Thời gian đăng ký:</td>
                                <td style="padding: 8px 0; color: #475569;">${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
                        Vui lòng lựa chọn hành động bên dưới để duyệt tài khoản:
                    </p>

                    <div style="text-align: center; margin: 0 0 24px 0;">
                        <a href="${approveUrl}" style="background: #10b981; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; margin-right: 8px;">
                            ✅ PHÊ DUYỆT TÀI KHOẢN
                        </a>
                        <a href="${rejectUrl}" style="background: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                            ❌ TỪ CHỐI
                        </a>
                    </div>

                    <p style="color: #94a3b8; font-size: 12px; margin: 0; line-height: 1.5; text-align: center;">
                        Link phê duyệt này dành riêng cho Admin và có hiệu lực trực tiếp.
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 Hệ thống Điểm danh Khuôn mặt - NTU</p>
                </div>
            </div>
        `,
    });
};

const sendTeacherApprovedEmail = async (email, name) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const loginUrl = `${clientUrl}/login`;

    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "🎉 Tài khoản Giảng viên của bạn đã được Admin phê duyệt!",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">🎉 Tài khoản đã được phê duyệt!</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 13px; margin: 0;">Hệ thống Điểm danh Khuôn mặt AI</p>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Xin chào thầy/cô <strong>${name}</strong>,</p>
                    <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        Quản trị viên đã kiểm tra thông tin và chính thức <strong>Phê duyệt</strong> tài khoản Giảng viên của thầy/cô trên hệ thống.
                    </p>
                    <div style="text-align: center; margin: 0 0 24px 0;">
                        <a href="${loginUrl}" style="background: #059669; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">
                            🚀 Đăng nhập ngay
                        </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">
                        Chúc thầy/cô có trải nghiệm tuyệt vời khi sử dụng hệ thống!
                    </p>
                </div>
                <div style="background: #f1f5f9; padding: 16px 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0;">© 2026 Hệ thống Điểm danh Khuôn mặt - NTU</p>
                </div>
            </div>
        `,
    });
};

const sendTeacherRejectedEmail = async (email, name) => {
    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Thông báo về yêu cầu đăng ký tài khoản Giảng viên",
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 20px; margin: 0 0 8px 0; font-weight: 700;">Thông báo đăng ký tài khoản</h1>
                </div>
                <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Xin chào <strong>${name}</strong>,</p>
                    <p style="color: #475569; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
                        Rất tiếc, yêu cầu đăng ký tài khoản Giảng viên của bạn không được Quản trị viên phê duyệt. Nếu có thắc mắc, vui lòng liên hệ trực tiếp với bộ phận Quản trị hệ thống.
                    </p>
                </div>
            </div>
        `,
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendAdminApprovalRequestEmail,
    sendTeacherApprovedEmail,
    sendTeacherRejectedEmail,
};
