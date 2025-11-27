import prisma from './src/services/prisma.js';

async function main() {
  const result = await prisma.sensorData.deleteMany({
    where: {
      aqi: {
        gt: 60
      }
    }
  });
  console.log(`Registros excluídos: ${result.count}`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
