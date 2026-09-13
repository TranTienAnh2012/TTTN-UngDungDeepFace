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

const sendPasswordResetEmail = async (email, name, token) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password?token=${token}`;

    await transporter.sendMail({
        from: `"Hệ thống Điểm danh" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Đặt lại mật khẩu",
        html: `
            <h2>Xin chào ${name},</h2>
            <p>Bạn vừa yêu cầu đặt lại mật khẩu.</p>
            <p>Vui lòng click vào link bên dưới để đặt lại mật khẩu của bạn:</p>
            <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#dc3545;color:#fff;text-decoration:none;border-radius:5px;">Đặt lại mật khẩu</a>
            <p>Link có hiệu lực trong ${process.env.RESET_PASSWORD_EXPIRES_MINUTES || 15} phút.</p>
            <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
        `,
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail,
};
