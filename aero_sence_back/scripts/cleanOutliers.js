import prisma from '../src/services/prisma.js';

async function main() {
  console.log('Limpando leituras fora da faixa realista...');

  const where = {
    OR: [
      { temperature: { lt: -10 } },
      { temperature: { gt: 60 } },
      { humidity: { lt: 0 } },
      { humidity: { gt: 100 } },
      { co2: { lt: 0 } },
    ],
  };

  const count = await prisma.sensorData.count({ where });
  console.log(`Registros a excluir: ${count}`);

  if (count === 0) {
    console.log('Nenhum registro fora da faixa encontrado.');
    return;
  }

  const deleted = await prisma.sensorData.deleteMany({ where });
  console.log(`Registros excluídos: ${deleted.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
