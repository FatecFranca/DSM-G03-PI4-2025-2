import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SEGREDO_PADRAO_PARA_DESENVOLVIMENTO';

export const protect = (req, res, next) => {
  // Allow preflight requests to pass through without auth check
  if (req.method === 'OPTIONS') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.debug('[authMiddleware] Missing or invalid Authorization header for', req.method, req.originalUrl);
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.userId };
    next();
  } catch (error) {
    console.debug('[authMiddleware] Token verification failed:', error && error.message);
    res.status(401).json({ message: 'Token inválido.' });
  }
};
