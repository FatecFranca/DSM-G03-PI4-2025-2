import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../services/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_PADRAO_PARA_DESENVOLVIMENTO';

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
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};