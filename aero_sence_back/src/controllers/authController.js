// Função resetPassword ainda não implementada
export const resetPassword = async (req, res) => {
    res.status(501).json({ message: 'resetPassword não implementado.' });
};
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
        if (!user) {
            return res.status(200).json({ message: 'Se um utilizador com esse e-mail existir, um link de recuperação foi enviado.' });
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // ...implementar lógica de envio de e-mail...
    } catch (error) {
        res.status(500).json({ message: 'Erro ao processar solicitação de recuperação de senha.' });
    }
};
