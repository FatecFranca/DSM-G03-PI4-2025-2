import { Response } from 'express';
import prisma from '../services/prisma.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';

// Busca o perfil do utilizador logado
export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            select: { id: true, name: true, email: true } 
        });

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil do utilizador.' });
    }
};

// Atualiza o perfil do utilizador logado
export const updateUserProfile = async (req: AuthRequest, res: Response) => {
    const { name, email } = req.body;
    
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user?.id },
            data: { name, email },
            select: { id: true, name: true, email: true }
        });
        res.json({ message: 'Perfil atualizado com sucesso!', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar o perfil. O e-mail já pode estar em uso.' });
    }
};

// --- FUNÇÃO DE EXCLUSÃO COMPLETA ---
// Apaga a conta do utilizador logado
export const deleteUserAccount = async (req: AuthRequest, res: Response) => {
    console.log(`--- A apagar a conta do utilizador com o ID: ${req.user?.id} ---`); // Log para depuração
    try {
        await prisma.user.delete({
            where: { id: req.user?.id },
        });
        res.status(200).json({ message: 'Conta apagada com sucesso.' });
    } catch (error) {
        console.error("Erro no servidor ao apagar a conta:", error); // Log de erro detalhado
        res.status(500).json({ message: 'Erro ao apagar a conta.' });
    }
};

// Altera a palavra-passe do utilizador
export const changePassword = async (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'A palavra-passe atual e a nova são obrigatórias.' });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user?.id } });

        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'A palavra-passe atual está incorreta.' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: req.user?.id },
            data: { password: hashedNewPassword },
        });

        res.json({ message: 'Palavra-passe alterada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar a palavra-passe.' });
    }
};