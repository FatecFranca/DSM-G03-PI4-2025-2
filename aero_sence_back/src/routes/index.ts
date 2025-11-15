// Bloco de Rotas 1 CORRIGIDO (routes/index.ts)

import { Router } from 'express';
import { createSensorData, getLatestSensorData, getSensorHistory, createSensorBatch, getCo2Forecast } from '../controllers/sensorController.js';
import { getUserProfile, updateUserProfile, deleteUserAccount, changePassword } from '../controllers/userController.js'; 
import { protect } from '../middleware/authMiddleware.js';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';
import { getStatistics } from '../controllers/statsController.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

// AÇÃO CRÍTICA: Removido 'protect' para permitir o envio do ESP32 (Erro 401 resolvido)
router.post('/sensor', createSensorData); 
router.post('/sensor/batch', createSensorBatch);
router.get('/sensor/history', getSensorHistory);
router.get('/sensor/statistics', getStatistics);
router.get('/sensor/forecast-co2', getCo2Forecast);

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