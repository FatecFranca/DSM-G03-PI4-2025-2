import prisma from '../services/prisma.js';

export const createSensorData = async (req, res) => {
    // Campos esperados: 4 de gás/qualidade + 2 de ambiente
    const { aqi, co2, vocs, nox, temperature, humidity, pressure } = req.body;

    // 1. Validação de TODOS os campos obrigatórios
    if (aqi === undefined || co2 === undefined || vocs === undefined || nox === undefined || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ 
            message: 'Todos os campos de sensor (aqi, co2, vocs, nox, temperature, humidity) são obrigatórios.' 
        });
    }

    try {
        // Log para depuração: mostrar todos os dados recebidos
        console.log('Dados recebidos do sensor:', req.body);
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
                pressure: pressure !== undefined ? Number(pressure) : null,
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
        // Aceita parâmetro opcional 'limit' para limitar resultados
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        
        const query = {
            orderBy: { createdAt: 'desc' }
        };
        
        // Se limit for fornecido, aplica o limite
        if (limit && limit > 0) {
            query.take = limit;
        }
        
        const history = await prisma.sensorData.findMany(query);
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

// Recebe lote de leituras para quando o dispositivo armazenou offline (versão JS)
export const createSensorBatch = async (req, res) => {
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
        return res.status(400).json({ message: 'Array readings vazio ou inválido.' });
    }

    const invalid = readings.find(r => [r.aqi, r.co2, r.vocs, r.nox, r.temperature, r.humidity]
        .some(v => v === undefined));
    if (invalid) {
        return res.status(400).json({ message: 'Um ou mais itens do lote estão incompletos.' });
    }

    try {
        const prepared = readings.map(r => ({
            aqi: Number(r.aqi),
            co2: Number(r.co2),
            vocs: Number(r.vocs),
            nox: Number(r.nox),
            temperature: Number(r.temperature),
            humidity: Number(r.humidity),
            pressure: r.pressure !== undefined ? Number(r.pressure) : null,
            createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
        }));

        const result = await prisma.sensorData.createMany({ data: prepared });
        res.status(201).json({ inserted: result.count });
    } catch (error) {
        console.error('Erro ao inserir lote:', error);
        res.status(500).json({ message: 'Falha ao inserir lote.' });
    }
};

// --- Previsão de CO2 (backend, versão JS) ---

export const getCo2Forecast = async (req, res) => {
    try {
        const history = await prisma.sensorData.findMany({
            orderBy: { createdAt: 'desc' },
            take: 200, // Pega apenas os últimos 200 registros (mais recentes)
        });

        // Ordena em ordem crescente de tempo
        const sortedHistory = history.reverse();

        const now = Date.now();
        const cutoffTime = now - (48 * 60 * 60 * 1000); // Últimas 48 horas

        // Filtra apenas últimas 48h para previsão mais precisa
        const points = sortedHistory
            .filter(h => {
                if (!h.createdAt || h.co2 === null || h.co2 === undefined) return false;
                const ts = h.createdAt.getTime();
                return ts >= cutoffTime && ts <= now;
            })
            .map(h => ({
                ts: h.createdAt.getTime(),
                co2: Number(h.co2),
            }));

        console.log('Qtd pontos CO2 para forecast (últimas 48h):', points.length);

        if (points.length < 3) {
            const media = points.length === 0
                ? 400 // Valor padrão se não houver dados
                : points.reduce((s, p) => s + p.co2, 0) / points.length;

            // Gera previsão a cada 2 horas
            const forecast = [];
            const ci = [];
            for (let h = 2; h <= 24; h += 2) {
                const ts = now + h * 60 * 60 * 1000;
                forecast.push({ ts, co2: media });
                ci.push({ ts, upper: media * 1.1, lower: Math.max(0, media * 0.9) });
            }

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

        const lastTs = points[points.length - 1].ts;
        const lastCo2 = points[points.length - 1].co2;
        const minCo2 = Math.min(...yArr);
        const maxCo2 = Math.max(...yArr);
        const rangeCo2 = maxCo2 - minCo2 || 1;
        const maxRealistic = Math.max(1000, meanY * 2);

        // Gera previsão a cada 2 horas (12 pontos nas 24h)
        const forecast = [];
        const ci = [];

        for (let h = 2; h <= 24; h += 2) {
            const ts = now + h * 60 * 60 * 1000;
            const x = xArr[xArr.length - 1] + (ts - lastTs) / (1000 * 60 * 60);

            let y = a + b * x;

            // Suaviza mudanças bruscas
            if (Math.abs(b) * h > rangeCo2 * 1.5) {
                y = lastCo2 + b * h * 0.4;
            }

            const sePred = se * Math.sqrt(
                1 + 1 / n + Math.pow(x - meanX, 2) / (sumXX - n * Math.pow(meanX, 2))
            );

            const erroBruto = z * sePred;
            const erroMax = Math.max(10, meanY * 0.15); // Intervalo de confiança: máx 15% da média ou 10 ppm
            const erro = Math.min(erroBruto, erroMax);

            let upper = y + erro;
            let lower = y - erro;

            y = Math.max(0, Math.min(y, maxRealistic));
            upper = Math.max(0, Math.min(upper, maxRealistic));
            lower = Math.max(0, Math.min(lower, maxRealistic));

            forecast.push({ ts, co2: Math.round(y * 100) / 100 });
            ci.push({ ts, upper: Math.round(upper * 100) / 100, lower: Math.round(lower * 100) / 100 });
        }

        return res.json({ forecast, ci });
    } catch (error) {
        console.error('Erro ao calcular previsão de CO₂ no backend (JS):', error);
        return res.status(500).json({ message: 'Erro ao calcular previsão de CO₂.' });
    }
};

export const getTemperatureForecast = async (req, res) => {
    try {
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

        return res.json({ forecast, ci });
    } catch (error) {
        console.error('Erro ao calcular previsão de temperatura:', error);
        return res.status(500).json({ message: 'Erro ao calcular previsão de temperatura.' });
    }
};