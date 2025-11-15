const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/sensor:
 *   get:
 *     summary: Obtém dados em tempo real dos sensores
 *     description: Retorna os dados atuais de qualidade do ar capturados pelos sensores MQ-135 e CCS811
 *     tags:
 *       - Sensores
 *     responses:
 *       200:
 *         description: Dados dos sensores obtidos com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 aqi:
 *                   type: number
 *                   example: 85
 *                   description: Índice de Qualidade do Ar (0-500)
 *                 pm25:
 *                   type: number
 *                   example: 35.2
 *                   description: Partículas finas em μg/m³
 *                 pm10:
 *                   type: number
 *                   example: 42.8
 *                   description: Partículas inaláveis em μg/m³
 *                 co2:
 *                   type: number
 *                   example: 410
 *                   description: Dióxido de Carbono em ppm
 *                 nh3:
 *                   type: number
 *                   example: 12.5
 *                   description: Amônia em ppm
 *                 benzeno:
 *                   type: number
 *                   example: 25.3
 *                   description: Benzeno em ppm
 *                 alcool:
 *                   type: number
 *                   example: 5.2
 *                   description: Álcool em ppm
 *                 etanol:
 *                   type: number
 *                   example: 3.1
 *                   description: Etanol em ppm
 *                 nox:
 *                   type: number
 *                   example: 15.7
 *                   description: Óxido Nítrico em ppm
 *                 fumaca:
 *                   type: number
 *                   example: 8.9
 *                   description: Fumaça em ppm
 *                 humidity:
 *                   type: number
 *                   example: 65
 *                   description: Umidade relativa do ar em %
 *                 temperature:
 *                   type: number
 *                   example: 24.5
 *                   description: Temperatura em °C
 *       500:
 *         description: Erro ao buscar dados dos sensores
 */
router.get('/sensor', (req, res) => {
  try {
    // Aqui você fará a leitura dos sensores (MQ-135/CCS811)
    const sensorData = {
      aqi: 85,
      pm25: 35.2,
      pm10: 42.8,
      co2: 410,
      nh3: 12.5,
      benzeno: 25.3,
      alcool: 5.2,
      etanol: 3.1,
      nox: 15.7,
      fumaca: 8.9,
      humidity: 65,
      temperature: 24.5
    };
    res.json(sensorData);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados dos sensores' });
  }
});

/**
 * @swagger
 * /api/sensor/history:
 *   get:
 *     summary: Obtém histórico dos dados dos sensores
 *     description: Retorna o histórico de dados capturados pelos sensores nos últimos dias
 *     tags:
 *       - Sensores
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Número de dias do histórico (padrão 7)
 *     responses:
 *       200:
 *         description: Histórico obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   aqi:
 *                     type: number
 *                   co2:
 *                     type: number
 *                   nh3:
 *                     type: number
 */
router.get('/sensor/history', (req, res) => {
  try {
    const days = req.query.days || 7;
    const history = [];
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

module.exports = router;
