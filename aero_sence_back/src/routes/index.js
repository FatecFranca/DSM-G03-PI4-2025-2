// routes/index.js (FINAL)

// 1. Organize todas as importações no topo
import { Router } from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getStatistics, getDatabaseInfo } from '../controllers/statsController.js';

// Controladores de Autenticação
import { register, login, forgotPassword, resetPassword } from '../controllers/authController.js';

// Controladores do Sensor
import { createSensorData, getLatestSensorData, getSensorHistory, createSensorBatch, getCo2Forecast } from '../controllers/sensorController.js';

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
router.post('/sensor/batch', createSensorBatch);
router.get('/sensor/history', getSensorHistory);
router.get('/sensor/statistics', getStatistics);
router.get('/sensor/database-info', getDatabaseInfo);
router.get('/sensor/forecast-co2', getCo2Forecast);
router.get('/sensor/latest', getLatestSensorData);

// Rotas do Usuário (Protegidas)
/**
 * @openapi
 * /api/user/profile:
 *   get:
 *     tags:
 *       - Usuário
 *     summary: Obtém o perfil do utilizador autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil do utilizador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       401:
 *         description: Não autorizado
 */
/**
 * @openapi
 * /api/user/profile:
 *   put:
 *     tags:
 *       - Usuário
 *     summary: Atualiza o nome ou e-mail do utilizador (parcial)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       400:
 *         description: Nenhum campo para atualizar
 *       401:
 *         description: Não autorizado
 */
/**
 * @openapi
 * /api/user/password:
 *   put:
 *     tags:
 *       - Usuário
 *     summary: Altera a senha do utilizador
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Requisição inválida
 *       401:
 *         description: Senha atual incorreta / não autorizado
 */
/**
 * @openapi
 * /api/user/account:
 *   delete:
 *     tags:
 *       - Usuário
 *     summary: Exclui a conta do utilizador autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conta apagada com sucesso
 *       401:
 *         description: Não autorizado
 */
router.get('/user/profile', protect, getUserProfile);
router.put('/user/profile', protect, updateUserProfile);
router.put('/user/password', protect, changePassword);
router.delete('/user/account', protect, deleteUserAccount);

// 4. Exporte o router no final
export default router;