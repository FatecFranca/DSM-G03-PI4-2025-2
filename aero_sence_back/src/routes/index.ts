// Bloco de Rotas 1 CORRIGIDO (routes/index.ts)

import { Router } from 'express';
import { createSensorData, getLatestSensorData } from '../controllers/sensorController.js';
import { getUserProfile, updateUserProfile, deleteUserAccount, changePassword } from '../controllers/userController.js'; 
import { protect } from '../middleware/authMiddleware.js';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

// AÇÃO CRÍTICA: Removido 'protect' para permitir o envio do ESP32 (Erro 401 resolvido)
router.post('/sensor', createSensorData); 

// Rotas de Sensor e Usuário que precisam de autenticação permanecem protegidas
router.get('/sensor/latest', protect, getLatestSensorData);

router.get('/user/profile', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);
router.delete('/user/account', protect, deleteUserAccount);
router.put('/user/password', protect, changePassword);

// As rotas forgot-password e reset-password não devem ser protegidas
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

export default router;