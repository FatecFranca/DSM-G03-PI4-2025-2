import prisma from '../services/prisma.js';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req, res) => {
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

export const updateUserProfile = async (req, res) => {
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

export const deleteUserAccount = async (req, res) => {
    console.log(`--- A apagar a conta do utilizador com o ID: ${req.user?.id} ---`);
    try {
        await prisma.user.delete({
            where: { id: req.user?.id },
        });
        res.status(200).json({ message: 'Conta apagada com sucesso.' });
    } catch (error) {
        console.error("Erro no servidor ao apagar a conta:", error);
        res.status(500).json({ message: 'Erro ao apagar a conta.' });
    }
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'A palavra-passe atual e a nova são obrigatórias.' });
    }
    // ...implementar lógica de troca de senha...
};
