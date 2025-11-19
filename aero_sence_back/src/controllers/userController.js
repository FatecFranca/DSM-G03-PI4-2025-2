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
    try {
        const updates = {};
        if (typeof req.body.name !== 'undefined') updates.name = req.body.name;
        if (typeof req.body.email !== 'undefined') updates.email = req.body.email;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Nenhum campo para atualizar.' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user?.id },
            data: updates,
            select: { id: true, name: true, email: true }
        });
        res.json({ message: 'Perfil atualizado com sucesso!', user: updatedUser });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
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

    try {
        console.debug(`[userController] changePassword attempt for user id=${req.user?.id}`);
        // Log lengths only (never log plaintext passwords)
        console.debug(`[userController] password lengths current=${String(currentPassword).length} new=${String(newPassword).length}`);

        const user = await prisma.user.findUnique({ where: { id: req.user?.id } });
        if (!user) {
            console.debug('[userController] user not found for id=', req.user?.id);
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        // Comparar senha atual
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            console.debug('[userController] currentPassword mismatch for user id=', req.user?.id);
            return res.status(401).json({ message: 'Senha atual incorreta.' });
        }

        // Validar nova senha simples (pode ser estendido)
        if (newPassword.length < 6) return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres.' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({ where: { id: req.user?.id }, data: { password: hashed } });

        console.debug('[userController] password changed successfully for user id=', req.user?.id);
        return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return res.status(500).json({ message: 'Erro ao alterar a senha.' });
    }
};
