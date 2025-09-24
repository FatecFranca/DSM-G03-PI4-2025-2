import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: true, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;

    const mailOptions = {
        from: `"AeroSense" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Recuperação de Senha - AeroSense',
        html: `
            <p>Você solicitou uma redefinição de senha para a sua conta AeroSense.</p>
            <p>Clique aqui <a href="${resetUrl}">Redefinir sua Senha</a> para criar uma nova senha.</p>
            <p>Este link é válido por 10 minutos.</p>
            <p>Se você não solicitou esta alteração, por favor, ignore este e-mail.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
};