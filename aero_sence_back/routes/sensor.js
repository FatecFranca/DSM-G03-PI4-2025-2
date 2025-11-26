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

/**
 * @swagger
 * /api/sensor/database-info:
 *   get:
 *     summary: Obtém informações completas do banco de dados
 *     description: Retorna total de registros, primeiro e último registro, contagem por dia e últimos registros
 *     tags:
 *       - Sensores
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Número de registros recentes a retornar (padrão 50)
 *     responses:
 *       200:
 *         description: Informações do banco obtidas com sucesso
 */
const { getDatabaseInfo } = require('../controllers/databaseController');
router.get('/sensor/database-info', getDatabaseInfo);

/**
 * @swagger
 * /api/sensor/forecast-temperature:
 *   get:
 *     summary: Obtém previsão de temperatura para as próximas 24 horas
 *     tags:
 *       - Sensores
 *     responses:
 *       200:
 *         description: Previsão gerada com sucesso
 */
router.get('/sensor/forecast-temperature', async (req, res) => {
  try {
    const { PrismaClient } = require('../generated/prisma');
    const prisma = new PrismaClient();
    
    const history = await prisma.sensorData.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const sortedHistory = history.reverse();
    const now = Date.now();
    const cutoffTime = now - (48 * 60 * 60 * 1000);

    const points = sortedHistory
      .filter(h => {
        if (!h.createdAt || h.temperature === null || h.temperature === undefined) return false;
        const ts = h.createdAt.getTime();
        return ts >= cutoffTime && ts <= now;
      })
      .map(h => ({
        ts: h.createdAt.getTime(),
        temp: Number(h.temperature),
      }));

    console.log('Qtd pontos Temperatura para forecast (últimas 48h):', points.length);

    if (points.length < 3) {
      const media = points.length === 0 ? 25 : points.reduce((s, p) => s + p.temp, 0) / points.length;
      const forecast = [];
      const ci = [];
      for (let h = 2; h <= 24; h += 2) {
        const ts = now + h * 60 * 60 * 1000;
        forecast.push({ ts, temperature: media });
        ci.push({ ts, upper: media + 2, lower: media - 2 });
      }
      await prisma.$disconnect();
      return res.json({ forecast, ci });
    }

    const firstTs = points[0].ts;
    const xArr = points.map(p => (p.ts - firstTs) / (1000 * 60 * 60));
    const yArr = points.map(p => p.temp);
    const n = xArr.length;

    const sumX = xArr.reduce((a, b) => a + b, 0);
    const sumY = yArr.reduce((a, b) => a + b, 0);
    const sumXY = xArr.reduce((a, b, i) => a + b * yArr[i], 0);
    const sumXX = xArr.reduce((a, b) => a + b * b, 0);

    const meanX = sumX / n;
    const meanY = sumY / n;

    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) {
      await prisma.$disconnect();
      return res.status(400).json({ message: 'Não foi possível calcular a regressão.' });
    }

    const b = (n * sumXY - sumX * sumY) / denom;
    const a = meanY - b * meanX;

    const yHat = xArr.map(x => a + b * x);
    const residuals = yArr.map((y, i) => y - yHat[i]);
    const sse = residuals.reduce((s, r) => s + r * r, 0);
    const se = Math.sqrt(sse / Math.max(1, n - 2));

    const z = 1.28;
    const lastTs = points[points.length - 1].ts;
    const lastTemp = points[points.length - 1].temp;
    const minTemp = Math.min(...yArr);
    const maxTemp = Math.max(...yArr);
    const rangeTemp = maxTemp - minTemp || 1;

    const forecast = [];
    const ci = [];

    for (let h = 2; h <= 24; h += 2) {
      const ts = now + h * 60 * 60 * 1000;
      const x = xArr[xArr.length - 1] + (ts - lastTs) / (1000 * 60 * 60);

      let y = a + b * x;

      if (Math.abs(b) * h > rangeTemp * 1.5) {
        y = lastTemp + b * h * 0.4;
      }

      const sePred = se * Math.sqrt(
        1 + 1 / n + Math.pow(x - meanX, 2) / (sumXX - n * Math.pow(meanX, 2))
      );

      const erroBruto = z * sePred;
      const erroMax = Math.max(1, meanY * 0.1);
      const erro = Math.min(erroBruto, erroMax);

      let upper = y + erro;
      let lower = y - erro;

      y = Math.max(0, Math.min(y, 50));
      upper = Math.max(0, Math.min(upper, 50));
      lower = Math.max(0, Math.min(lower, 50));

      forecast.push({ ts, temperature: Math.round(y * 100) / 100 });
      ci.push({ ts, upper: Math.round(upper * 100) / 100, lower: Math.round(lower * 100) / 100 });
    }

    await prisma.$disconnect();
    return res.json({ forecast, ci });
  } catch (error) {
    console.error('Erro ao calcular previsão de temperatura:', error);
    return res.status(500).json({ message: 'Erro ao calcular previsão de temperatura.' });
  }
});

module.exports = router;
