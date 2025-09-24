import { Request, Response } from 'express';
import prisma from '../services/prisma.js';

// Guarda uma nova leitura de sensor no banco de dados
export const createSensorData = async (req: Request, res: Response) => {
    const { aqi, co2, vocs, nox } = req.body;

    if (aqi === undefined || co2 === undefined || vocs === undefined || nox === undefined) {
        return res.status(400).json({ message: 'Todos os campos de sensor (aqi, co2, vocs, nox) são obrigatórios.' });
    }

    try {
        const newSensorData = await prisma.sensorData.create({
            data: {
                aqi: Number(aqi),
                co2: Number(co2),
                vocs: Number(vocs),
                nox: Number(nox),
            },
        });
        res.status(201).json(newSensorData);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao guardar os dados do sensor.' });
    }
};

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
        res.status(500).json({ message: 'Erro ao buscar os dados mais recentes.' });
    }
};