// src/routes/index.ts
import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { createSensorData, getLatestSensorData } from '../controllers/sensorController.js';
import { getUserProfile, updateUserProfile, deleteUserAccount, changePassword } from '../controllers/userController.js'; // 1. IMPORTE AS NOVAS FUNÇÕES
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// --- Rotas de Autenticação (Públicas) ---
router.post('/auth/register', register);
router.post('/auth/login', login);

// --- Rotas de Dados do Sensor (Protegidas) ---
router.get('/sensor/latest', protect, getLatestSensorData);
router.post('/sensor', protect, createSensorData);

router.get('/user/profile', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);
router.delete('/user/account', protect, deleteUserAccount);
router.put('/user/password', protect, changePassword);

export default router;