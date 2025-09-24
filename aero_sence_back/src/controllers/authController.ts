import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../services/prisma.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
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
        res.status(500).json({ message: 'Erro ao registrar usuário. O e-mail já pode estar em uso.' });
    }
};

export const login = async (req: Request, res: Response) => {
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

export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(200).json({ message: 'Se um utilizador com esse e-mail existir, um link de recuperação foi enviado.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // Válido por 10 minutos

        await prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: passwordResetToken,
                resetPasswordTokenExpiry: passwordResetTokenExpiry,
            },
        });

        await sendPasswordResetEmail(email, resetToken);

        res.status(200).json({ message: 'Um link de recuperação foi enviado.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao tentar recuperar a senha.' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'O token e a nova senha são obrigatórios.' });
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

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,       
                resetPasswordTokenExpiry: null,
            },
        });

        res.status(200).json({ message: 'Senha redefinida com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Ocorreu um erro no servidor.' });
    }
};