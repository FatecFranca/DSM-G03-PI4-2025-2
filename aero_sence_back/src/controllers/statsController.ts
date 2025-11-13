import { Request, Response } from 'express';
import prisma from '../services/prisma';
import * as stats from 'simple-statistics';

// Calcular estatísticas detalhadas para um período específico
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const { period = '7d' } = req.query; // '24h', '7d', '30d'

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Buscar dados do período
    const data = await prisma.sensorData.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (data.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhum dado encontrado para o período especificado' 
      });
    }

    // Extrair arrays de valores
    const co2Values = data.map(d => d.co2);
    const tempValues = data.map(d => d.temperature);
    const humidityValues = data.map(d => d.humidity);
    const vocsValues = data.map(d => d.vocs);
    const noxValues = data.map(d => d.nox);

    // Calcular estatísticas para CO₂
    const co2Stats = {
      media: parseFloat(stats.mean(co2Values).toFixed(2)),
      mediana: parseFloat(stats.median(co2Values).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(co2Values).toFixed(2)),
      minimo: parseFloat(stats.min(co2Values).toFixed(2)),
      maximo: parseFloat(stats.max(co2Values).toFixed(2)),
      assimetria: parseFloat(stats.sampleSkewness(co2Values).toFixed(2)),
      coefVariacao: parseFloat(((stats.standardDeviation(co2Values) / stats.mean(co2Values)) * 100).toFixed(1)),
      percentil95: parseFloat(stats.quantile(co2Values, 0.95).toFixed(2)),
      tempoRisco: calcularTempoRisco(co2Values, 1000), // CO₂ > 1000 ppm é considerado risco
    };

    // Calcular estatísticas para Temperatura
    const temperaturaStats = {
      media: parseFloat(stats.mean(tempValues).toFixed(2)),
      mediana: parseFloat(stats.median(tempValues).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(tempValues).toFixed(2)),
      minimo: parseFloat(stats.min(tempValues).toFixed(2)),
      maximo: parseFloat(stats.max(tempValues).toFixed(2)),
      assimetria: parseFloat(stats.sampleSkewness(tempValues).toFixed(2)),
      coefVariacao: parseFloat(((stats.standardDeviation(tempValues) / stats.mean(tempValues)) * 100).toFixed(1)),
      percentil95: parseFloat(stats.quantile(tempValues, 0.95).toFixed(2)),
      tempoRisco: calcularTempoRisco(tempValues, 28, 18), // Temp < 18°C ou > 28°C
    };

    // Calcular estatísticas para Umidade
    const umidadeStats = {
      media: parseFloat(stats.mean(humidityValues).toFixed(1)),
      mediana: parseFloat(stats.median(humidityValues).toFixed(1)),
      desvioPadrao: parseFloat(stats.standardDeviation(humidityValues).toFixed(1)),
      minimo: parseFloat(stats.min(humidityValues).toFixed(1)),
      maximo: parseFloat(stats.max(humidityValues).toFixed(1)),
      assimetria: parseFloat(stats.sampleSkewness(humidityValues).toFixed(2)),
      coefVariacao: parseFloat(((stats.standardDeviation(humidityValues) / stats.mean(humidityValues)) * 100).toFixed(1)),
      percentil95: parseFloat(stats.quantile(humidityValues, 0.95).toFixed(1)),
      tempoRisco: calcularTempoRisco(humidityValues, 70, 30), // Umidade < 30% ou > 70%
    };

    // Calcular estatísticas para VOCs
    const vocsStats = {
      media: parseFloat(stats.mean(vocsValues).toFixed(2)),
      mediana: parseFloat(stats.median(vocsValues).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(vocsValues).toFixed(2)),
      minimo: parseFloat(stats.min(vocsValues).toFixed(2)),
      maximo: parseFloat(stats.max(vocsValues).toFixed(2)),
      percentil95: parseFloat(stats.quantile(vocsValues, 0.95).toFixed(2)),
    };

    // Calcular estatísticas para NOx
    const noxStats = {
      media: parseFloat(stats.mean(noxValues).toFixed(3)),
      mediana: parseFloat(stats.median(noxValues).toFixed(3)),
      desvioPadrao: parseFloat(stats.standardDeviation(noxValues).toFixed(3)),
      minimo: parseFloat(stats.min(noxValues).toFixed(3)),
      maximo: parseFloat(stats.max(noxValues).toFixed(3)),
      percentil95: parseFloat(stats.quantile(noxValues, 0.95).toFixed(3)),
    };

    res.json({
      period,
      totalReadings: data.length,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      co2: co2Stats,
      temperatura: temperaturaStats,
      umidade: umidadeStats,
      vocs: vocsStats,
      nox: noxStats,
    });
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Erro ao calcular estatísticas' });
  }
};

// Função auxiliar para calcular tempo em risco (% de leituras fora da faixa segura)
function calcularTempoRisco(
  values: number[], 
  maxThreshold: number, 
  minThreshold?: number
): number {
  const totalReadings = values.length;
  let riskReadings = 0;

  for (const value of values) {
    if (minThreshold !== undefined) {
      // Faixa com mínimo e máximo (ex: temperatura 18-28°C)
      if (value < minThreshold || value > maxThreshold) {
        riskReadings++;
      }
    } else {
      // Apenas máximo (ex: CO₂ > 1000 ppm)
      if (value > maxThreshold) {
        riskReadings++;
      }
    }
  }

  return parseFloat(((riskReadings / totalReadings) * 100).toFixed(1));
}
