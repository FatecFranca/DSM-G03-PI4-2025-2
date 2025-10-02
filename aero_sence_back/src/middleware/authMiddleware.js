import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_PADRAO_PARA_DESENVOLVIMENTO';

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};
