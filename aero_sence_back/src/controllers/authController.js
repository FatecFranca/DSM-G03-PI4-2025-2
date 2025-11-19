import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../services/prisma.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    console.log('Dados recebidos no cadastro:', req.body);
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword },
        });
        res.status(201).json({ message: 'Usuário criado com sucesso!', userId: user.id });
    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário. O e-mail já pode estar em uso.' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
    }
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        if (!JWT_SECRET) {
            console.error('A chave secreta JWT (JWT_SECRET) não está definida no ficheiro .env');
            return res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        // Always return 200 to avoid leaking whether email exists
        if (!user) {
            return res.status(200).json({ message: 'Se um utilizador com esse e-mail existir, um link de recuperação foi enviado.' });
        }

        // Generate token and hashed token to store
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save hashed token and expiry on user record
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiry: expiry,
            },
        });

        // Send email with plain resetToken
        try {
            await sendPasswordResetEmail(user.email, resetToken);
        } catch (mailErr) {
            console.error('Erro ao enviar e-mail de recuperação:', mailErr);
            // Do not reveal mail errors to client
        }

        return res.status(200).json({ message: 'Se um utilizador com esse e-mail existir, um link de recuperação foi enviado.' });
    } catch (error) {
        console.error('forgotPassword error:', error);
        return res.status(500).json({ message: 'Erro ao processar solicitação de recuperação de senha.' });
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword, password } = req.body;
    const providedPassword = newPassword || password;
    if (!token || !providedPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }
    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpiry: { gt: new Date() },
            },
        });
        if (!user) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }
        const hashedPassword = await bcrypt.hash(providedPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null,
            },
        });
        return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        return res.status(500).json({ message: 'Erro ao redefinir senha.' });
    }
};
