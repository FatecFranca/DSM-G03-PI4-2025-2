// routes/index.js (FINAL)

// 1. Organize todas as importações no topo
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStatistics } from '../controllers/statsController.js';

// Controladores de Autenticação
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';

// Controladores do Sensor
import { createSensorData, getLatestSensorData, getSensorHistory, getCo2Forecast } from '../controllers/sensorController.js';

// Controladores do Usuário
import { getUserProfile, updateUserProfile, deleteUserAccount, changePassword } from '../controllers/userController.js';

// 2. Crie a instância do router LOGO APÓS as importações
const router = Router();

// 3. Agora, defina todas as suas rotas

// Rotas de Autenticação
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Rotas do Sensor (CORRIGIDAS)
// A rota POST /sensor deve ser pública para que o hardware (ESP32) possa enviar dados.
router.post('/sensor', createSensorData);
router.get('/sensor/history', getSensorHistory);
router.get('/sensor/statistics', getStatistics);
router.get('/sensor/forecast-co2', getCo2Forecast);
router.get('/sensor/latest', getLatestSensorData);

// Rotas do Usuário (Protegidas)
router.get('/user/profile', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);
router.put('/user/password', protect, changePassword);
router.delete('/user/account', protect, deleteUserAccount);

// 4. Exporte o router no final
export default router;