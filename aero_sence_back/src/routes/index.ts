import { Router } from 'express';
import { createSensorData, getLatestSensorData } from '../controllers/sensorController.js';
import { getUserProfile, updateUserProfile, deleteUserAccount, changePassword } from '../controllers/userController.js'; // 1. IMPORTE AS NOVAS FUNÇÕES
import { protect } from '../middleware/authMiddleware.js';
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/sensor/latest', protect, getLatestSensorData);
router.post('/sensor', protect, createSensorData);

router.get('/user/profile', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);
router.delete('/user/account', protect, deleteUserAccount);
router.put('/user/password', protect, changePassword);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

export default router;