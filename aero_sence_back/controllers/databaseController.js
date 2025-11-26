const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

async function getDatabaseInfo(req, res) {
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
    res.status(500).json({ 
      error: 'Erro ao buscar informações do banco de dados',
      details: error.message 
    });
  }
}

module.exports = { getDatabaseInfo };
