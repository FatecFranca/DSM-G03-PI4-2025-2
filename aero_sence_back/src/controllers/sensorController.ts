import { Request, Response } from 'express';
import prisma from '../services/prisma.js';

// Define a interface (tipo) COMPLETA, alinhada com os 6 campos enviados pelo ESP32 e o Prisma
interface CreateSensorDataBody {
    aqi: number;
    co2: number;
    vocs: number;
    nox: number;
    temperature: number;
    humidity: number;
    // Removendo mq135RawValue, pois ele é apenas um valor de cálculo interno no ESP32
}

export const createSensorData = async (req: Request<{}, {}, CreateSensorDataBody>, res: Response) => {
    // Desestruturação de TODOS os 6 campos
    const { aqi, co2, vocs, nox, temperature, humidity } = req.body;

    // 1. Validação de TODOS os 6 campos obrigatórios
    if (aqi === undefined || co2 === undefined || vocs === undefined || nox === undefined || temperature === undefined || humidity === undefined) {
        return res.status(400).json({ 
            message: 'Todos os campos de sensor (aqi, co2, vocs, nox, temperature, humidity) são obrigatórios.' 
        });
    }

    try {
        // 2. Criação do registro no banco de dados
        const newSensorData = await prisma.sensorData.create({
            data: {
                // Conversão de tipo garantida
                aqi: Number(aqi),
                co2: Number(co2),
                vocs: Number(vocs),
                nox: Number(nox),
                temperature: Number(temperature),
                humidity: Number(humidity),
            },
        });
        res.status(201).json(newSensorData);
    } catch (error) {
        console.error('Erro ao guardar os dados do sensor:', error);
        res.status(500).json({ message: 'Erro ao guardar os dados do sensor.' });
    }
};

// --- Funções de Leitura ---

// Busca a leitura mais recente do sensor
export const getLatestSensorData = async (req: Request, res: Response) => {
    try {
        const latestData = await prisma.sensorData.findFirst({
            orderBy: { createdAt: 'desc' },
        });

        if (!latestData) {
            return res.status(404).json({ message: 'Nenhum dado de sensor encontrado.' });
        }

        res.json(latestData);
    } catch (error) {
        console.error('Erro ao buscar os dados mais recentes:', error);
        res.status(500).json({ message: 'Erro ao buscar os dados mais recentes.' });
    }
};
// Se o getSensorHistory estiver no seu arquivo, mantenha-o.