async function removeOutliers() {
    console.log('Iniciando remoção de outliers...');
    try {
        const deletedRecords = await prisma.sensor.deleteMany({
            where: {
                OR: [ // O registro será apagado se QUALQUER uma destas for verdade
                    { aqi: { gt: 60 } },
                    { temperature: { gt: 40 } },
                    { humidity: { gt: 70 } }
                ]
            }
        });

        console.log(`Total de registros removidos (outliers): ${deletedRecords.count}`);
    } catch (error) {
        console.error('Erro ao remover outliers:', error);
    } finally {
        await prisma.$disconnect();
    }
}