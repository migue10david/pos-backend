import { PrismaClient } from "generated/prisma/client";

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...');

  // Generar 100 productos
  for (let i = 1; i <= 100; i++) {
    const name = `Producto ${i}`;
    const code = `PROD-${String(i).padStart(5, '0')}`; // Ej: PROD-00001
    const price = parseFloat((Math.random() * 1000 + 10).toFixed(2)); // Precio entre 10 y 1010

    await prisma.product.create({
      data: {
        name,
        code,
        price,
        // No incluimos OrderItems porque es una relación inversa y opcional
      },
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });