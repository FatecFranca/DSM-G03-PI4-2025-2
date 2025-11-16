import prisma from '../services/prisma.js';

export const createSensorData = async (req, res) => {
    // Campos esperados: 4 de gás/qualidade + 2 de ambiente
    const { aqi, co2, vocs, nox, temperature, humidity } = req.body;

    // 1. Validação de TODOS os campos obrigatórios
    if (aqi === undefined || co2 === undefined || vocs === undefined || nox === undefined || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ 
            message: 'Todos os campos de sensor (aqi, co2, vocs, nox, temperature, humidity) são obrigatórios.' 
        });
    }

    try {
        // 2. Criação do registro no banco de dados com todos os 6 campos
        const newSensorData = await prisma.sensorData.create({
            data: {
                // Conversão garantida para tipos numéricos (Int/Float)
                aqi: Number(aqi),
                co2: Number(co2),
                vocs: Number(vocs),
                nox: Number(nox),
                temperature: Number(temperature),
                humidity: Number(humidity),
                // mq135RawValue foi removido do modelo final do ESP32/Prisma
            },
        });
        res.status(201).json(newSensorData);
    } catch (error) {
        console.error('Erro ao guardar os dados do sensor:', error);
        res.status(500).json({ message: 'Erro ao guardar os dados do sensor.' });
    }
};

export const getSensorHistory = async (req, res) => {
    try {
        const history = await prisma.sensorData.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar o histórico de dados do sensor.' });
    }
};

export const getLatestSensorData = async (req, res) => {
    try {
        const latestData = await prisma.sensorData.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        if (!latestData) {
            return res.status(404).json({ message: 'Nenhum dado de sensor encontrado.' });
        }

        res.json(latestData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar os dados mais recentes.' });
    }
};

// --- Previsão de CO2 (backend, versão JS) ---

export const getCo2Forecast = async (req, res) => {
    try {
        const history = await prisma.sensorData.findMany({
            orderBy: { createdAt: 'asc' },
        });

        const points = history
            .filter(h => h.createdAt && h.co2 !== null && h.co2 !== undefined)
            .map(h => ({
                ts: h.createdAt.getTime(),
                co2: Number(h.co2),
            }));

        console.log('Qtd pontos CO2 para forecast (JS):', points.length);

        if (points.length < 3) {
            const now = Date.now();
            const media = points.length === 0
                ? 0
                : points.reduce((s, p) => s + p.co2, 0) / points.length;

            const hoursAhead = [1, 6, 12, 18, 24];
            const forecast = hoursAhead.map(h => ({
                ts: now + h * 60 * 60 * 1000,
                co2: media,
            }));
            const ci = hoursAhead.map(h => ({
                ts: now + h * 60 * 60 * 1000,
                upper: media * 1.1,
                lower: Math.max(0, media * 0.9),
            }));

            return res.json({ forecast, ci });
        }

        const firstTs = points[0].ts;
        const xArr = points.map(p => (p.ts - firstTs) / (1000 * 60 * 60));
        const yArr = points.map(p => p.co2);
        const n = xArr.length;

        const sumX = xArr.reduce((a, b) => a + b, 0);
        const sumY = yArr.reduce((a, b) => a + b, 0);
        const sumXY = xArr.reduce((a, b, i) => a + b * yArr[i], 0);
        const sumXX = xArr.reduce((a, b) => a + b * b, 0);

        const meanX = sumX / n;
        const meanY = sumY / n;

        const denom = n * sumXX - sumX * sumX;
        if (denom === 0) {
            return res.status(400).json({ message: 'Não foi possível calcular a regressão.' });
        }

        const b = (n * sumXY - sumX * sumY) / denom;
        const a = meanY - b * meanX;

        const yHat = xArr.map(x => a + b * x);
        const residuals = yArr.map((y, i) => y - yHat[i]);
        const sse = residuals.reduce((s, r) => s + r * r, 0);
        const se = Math.sqrt(sse / Math.max(1, n - 2));

        const z = 1.28; // ~90% para evitar faixas exageradas

        const now = Date.now();
        const lastTs = points[points.length - 1].ts;
        const lastCo2 = points[points.length - 1].co2;
        const minCo2 = Math.min(...yArr);
        const maxCo2 = Math.max(...yArr);
        const rangeCo2 = maxCo2 - minCo2 || 1;
        const maxRealistic = Math.max(800, meanY * 3);

        const hoursAhead = [1, 6, 12, 18, 24];
        const forecast = [];
        const ci = [];

        for (const h of hoursAhead) {
            const ts = now + h * 60 * 60 * 1000;
            const x = xArr[xArr.length - 1] + (ts - lastTs) / (1000 * 60 * 60);

            let y = a + b * x;

            if (Math.abs(b) * h > rangeCo2 * 1.5) {
                y = lastCo2 + b * h * 0.3;
            }

            const sePred = se * Math.sqrt(
                1 + 1 / n + Math.pow(x - meanX, 2) / (sumXX - n * Math.pow(meanX, 2))
            );

            const erroBruto = z * sePred;
            const erroMax = Math.max(0.3, meanY * 0.3); // máx 30% da média ou 0.3 ppm
            const erro = Math.min(erroBruto, erroMax);

            let upper = y + erro;
            let lower = y - erro;

            y = Math.max(0, Math.min(y, maxRealistic));
            upper = Math.max(0, Math.min(upper, maxRealistic));
            lower = Math.max(0, Math.min(lower, maxRealistic));

            forecast.push({ ts, co2: y });
            ci.push({ ts, upper, lower });
        }

        return res.json({ forecast, ci });
    } catch (error) {
        console.error('Erro ao calcular previsão de CO₂ no backend (JS):', error);
        return res.status(500).json({ message: 'Erro ao calcular previsão de CO₂.' });
    }
};