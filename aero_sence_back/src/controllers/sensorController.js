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