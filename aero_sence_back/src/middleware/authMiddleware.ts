import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_PADRAO_PARA_DESENVOLVIMENTO';

export interface AuthRequest extends Request {
  user?: { id: number };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

    // Adiciona o id do utilizador ao pedido para uso futuro
    req.user = { id: decoded.userId };

    next(); // Se o token for válido, continua para a rota
  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};