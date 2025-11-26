import prisma from '../services/prisma.js';
import * as stats from 'simple-statistics';

// Calcular estatísticas detalhadas para um período específico
export const getStatistics = async (req, res) => {
  try {
    const { period = '7d' } = req.query; // '24h', '7d', '30d'

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
        error: 'Nenhum dado encontrado para o período especificado',
      });
    }

    const co2Values = data.map((d) => d.co2);
    const tempValues = data.map((d) => d.temperature);
    const humidityValues = data.map((d) => d.humidity);
    const vocsValues = data.map((d) => d.vocs);
    const noxValues = data.map((d) => d.nox);

    const co2Stats = {
      media: parseFloat(stats.mean(co2Values).toFixed(2)),
      mediana: parseFloat(stats.median(co2Values).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(co2Values).toFixed(2)),
      minimo: parseFloat(stats.min(co2Values).toFixed(2)),
      maximo: parseFloat(stats.max(co2Values).toFixed(2)),
      assimetria: parseFloat(stats.sampleSkewness(co2Values).toFixed(2)),
      coefVariacao: parseFloat(
        ((stats.standardDeviation(co2Values) / stats.mean(co2Values)) * 100).toFixed(1)
      ),
      percentil95: parseFloat(stats.quantile(co2Values, 0.95).toFixed(2)),
      tempoRisco: calcularTempoRisco(co2Values, 1000),
    };

    const temperaturaStats = {
      media: parseFloat(stats.mean(tempValues).toFixed(2)),
      mediana: parseFloat(stats.median(tempValues).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(tempValues).toFixed(2)),
      minimo: parseFloat(stats.min(tempValues).toFixed(2)),
      maximo: parseFloat(stats.max(tempValues).toFixed(2)),
      assimetria: parseFloat(stats.sampleSkewness(tempValues).toFixed(2)),
      coefVariacao: parseFloat(
        ((stats.standardDeviation(tempValues) / stats.mean(tempValues)) * 100).toFixed(1)
      ),
      percentil95: parseFloat(stats.quantile(tempValues, 0.95).toFixed(2)),
      tempoRisco: calcularTempoRisco(tempValues, 28, 18),
    };

    const umidadeStats = {
      media: parseFloat(stats.mean(humidityValues).toFixed(1)),
      mediana: parseFloat(stats.median(humidityValues).toFixed(1)),
      desvioPadrao: parseFloat(stats.standardDeviation(humidityValues).toFixed(1)),
      minimo: parseFloat(stats.min(humidityValues).toFixed(1)),
      maximo: parseFloat(stats.max(humidityValues).toFixed(1)),
      assimetria: parseFloat(stats.sampleSkewness(humidityValues).toFixed(2)),
      coefVariacao: parseFloat(
        ((stats.standardDeviation(humidityValues) / stats.mean(humidityValues)) * 100).toFixed(1)
      ),
      percentil95: parseFloat(stats.quantile(humidityValues, 0.95).toFixed(1)),
      tempoRisco: calcularTempoRisco(humidityValues, 70, 30),
    };

    const vocsStats = {
      media: parseFloat(stats.mean(vocsValues).toFixed(2)),
      mediana: parseFloat(stats.median(vocsValues).toFixed(2)),
      desvioPadrao: parseFloat(stats.standardDeviation(vocsValues).toFixed(2)),
      minimo: parseFloat(stats.min(vocsValues).toFixed(2)),
      maximo: parseFloat(stats.max(vocsValues).toFixed(2)),
      percentil95: parseFloat(stats.quantile(vocsValues, 0.95).toFixed(2)),
    };

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

function calcularTempoRisco(values, maxThreshold, minThreshold) {
  const totalReadings = values.length;
  let riskReadings = 0;

  for (const value of values) {
    if (minThreshold !== undefined) {
      if (value < minThreshold || value > maxThreshold) {
        riskReadings++;
      }
    } else {
      if (value > maxThreshold) {
        riskReadings++;
      }
    }
  }

  return parseFloat(((riskReadings / totalReadings) * 100).toFixed(1));
}

// Função para visualizar dados do banco de dados
export const getDatabaseInfo = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Total de registros
    const totalRecords = await prisma.sensorData.count();

    // Primeiro e último registro
    const firstRecord = await prisma.sensorData.findFirst({
      orderBy: { createdAt: 'asc' }
    });

    const lastRecord = await prisma.sensorData.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Contagem por dia
    const allRecords = await prisma.sensorData.findMany({
      select: {
        createdAt: true
      }
    });

    const recordsByDay = {};
    allRecords.forEach(record => {
      const date = record.createdAt.toISOString().split('T')[0];
      recordsByDay[date] = (recordsByDay[date] || 0) + 1;
    });

    // Últimos registros
    const recentRecords = await prisma.sensorData.findMany({
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      totalRecords,
      firstRecord: firstRecord ? {
        date: firstRecord.createdAt,
        co2: firstRecord.co2,
        temperature: firstRecord.temperature,
        humidity: firstRecord.humidity,
        aqi: firstRecord.aqi
      } : null,
      lastRecord: lastRecord ? {
        date: lastRecord.createdAt,
        co2: lastRecord.co2,
        temperature: lastRecord.temperature,
        humidity: lastRecord.humidity,
        aqi: lastRecord.aqi
      } : null,
      recordsByDay,
      recentRecords: recentRecords.map(r => ({
        date: r.createdAt,
        co2: r.co2,
        temperature: r.temperature,
        humidity: r.humidity,
        aqi: r.aqi,
        vocs: r.vocs,
        nox: r.nox
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar informações do banco:', error);
    res.status(500).json({ error: 'Erro ao buscar informações do banco de dados' });
  }
};
