import zlib from 'zlib';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test1234!';

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function solidColorPng(width: number, height: number, [r, g, b]: [number, number, number]): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type: RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk('IHDR', ihdrData);

  const rowBytes = width * 3;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = r;
      raw[px + 1] = g;
      raw[px + 2] = b;
    }
  }
  const idat = pngChunk('IDAT', zlib.deflateSync(raw));
  const iend = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

async function saveSeedImage(productId: string, color: [number, number, number]): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, 'products', productId);
  await mkdir(dir, { recursive: true });
  const filename = 'seed-photo.png';
  await writeFile(path.join(dir, filename), solidColorPng(600, 400, color));
  return `/uploads/products/${productId}/${filename}`;
}

type SeedUser = {
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER';
};

async function upsertUser(user: SeedUser) {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: {
      email: user.email,
      name: user.name,
      role: user.role,
      passwordHash,
    },
  });
}

type SeedProduct = {
  name: string;
  description: string;
  basePriceCents: number;
  initialStock: number;
  stock: number;
  category: string;
  color: [number, number, number];
};

async function upsertProduct(sellerId: string, p: SeedProduct) {
  const existing = await prisma.product.findFirst({ where: { sellerId, name: p.name } });
  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: p.description,
          basePriceCents: p.basePriceCents,
          initialStock: p.initialStock,
          stock: p.stock,
          category: p.category,
        },
      })
    : await prisma.product.create({
        data: {
          sellerId,
          name: p.name,
          description: p.description,
          basePriceCents: p.basePriceCents,
          initialStock: p.initialStock,
          stock: p.stock,
          category: p.category,
        },
      });

  const hasImage = await prisma.productImage.findFirst({ where: { productId: product.id } });
  if (!hasImage) {
    const url = await saveSeedImage(product.id, p.color);
    await prisma.productImage.create({
      data: { productId: product.id, url, isPrimary: true },
    });
  }

  return product;
}

async function main() {
  console.log('Seeding test users...');

  const sellerA = await upsertUser({ email: 'seller1@test.com', name: 'Elena Torres', role: 'SELLER' });
  const sellerB = await upsertUser({ email: 'seller2@test.com', name: 'Carlos Ruiz', role: 'SELLER' });
  const sellerC = await upsertUser({ email: 'vendedor.prueba@example.com', name: 'Vendedor Prueba', role: 'SELLER' });
  const buyerA = await upsertUser({ email: 'buyer1@test.com', name: 'Ana Gomez', role: 'BUYER' });
  const buyerB = await upsertUser({ email: 'buyer2@test.com', name: 'Luis Fernandez', role: 'BUYER' });

  console.log('Seeding test products...');

  const sellerAProducts: SeedProduct[] = [
    {
      name: 'Camiseta Oversize Negra',
      description: 'Camiseta de algodon 100%, corte oversize, ideal para uso diario.',
      basePriceCents: 2499,
      initialStock: 40,
      stock: 35,
      category: 'Ropa',
      color: [30, 30, 30],
    },
    {
      name: 'Jean Slim Fit Azul',
      description: 'Jean de mezclilla stretch, corte slim, talles del 28 al 42.',
      basePriceCents: 5999,
      initialStock: 30,
      stock: 4,
      category: 'Ropa',
      color: [40, 70, 140],
    },
    {
      name: 'Campera Impermeable',
      description: 'Campera rompevientos impermeable con capucha desmontable.',
      basePriceCents: 8999,
      initialStock: 20,
      stock: 18,
      category: 'Ropa',
      color: [200, 60, 40],
    },
    {
      name: 'Gorra Bordada',
      description: 'Gorra de algodon con logo bordado, ajustable.',
      basePriceCents: 1899,
      initialStock: 50,
      stock: 2,
      category: 'Accesorios',
      color: [120, 90, 40],
    },
  ];

  const sellerBProducts: SeedProduct[] = [
    {
      name: 'Auriculares Inalambricos Pro',
      description: 'Auriculares bluetooth con cancelacion de ruido activa y 30hs de bateria.',
      basePriceCents: 12999,
      initialStock: 25,
      stock: 21,
      category: 'Electronica',
      color: [20, 20, 20],
    },
    {
      name: 'Parlante Portatil Waterproof',
      description: 'Parlante bluetooth resistente al agua IPX7, 12hs de autonomia.',
      basePriceCents: 4599,
      initialStock: 15,
      stock: 1,
      category: 'Electronica',
      color: [60, 130, 200],
    },
    {
      name: 'Cargador Rapido USB-C 65W',
      description: 'Cargador GaN compacto compatible con laptops y celulares.',
      basePriceCents: 2899,
      initialStock: 60,
      stock: 55,
      category: 'Electronica',
      color: [230, 230, 230],
    },
    {
      name: 'Mochila para Notebook',
      description: 'Mochila acolchada para notebooks de hasta 15.6", con puerto USB.',
      basePriceCents: 4999,
      initialStock: 22,
      stock: 20,
      category: 'Accesorios',
      color: [50, 50, 50],
    },
  ];

  const sellerCProducts: SeedProduct[] = [
    {
      name: 'Auriculares Bluetooth',
      description: 'Auriculares inalambricos con cancelacion de ruido',
      basePriceCents: 5999,
      initialStock: 30,
      stock: 27,
      category: 'Electronica',
      color: [25, 25, 30],
    },
    {
      name: 'Camiseta Basica',
      description: 'Camiseta de algodon 100%, varios colores',
      basePriceCents: 1499,
      initialStock: 25,
      stock: 23,
      category: 'Ropa',
      color: [180, 180, 185],
    },
    {
      name: 'Mochila Antirrobo',
      description: 'Mochila resistente con compartimento para laptop',
      basePriceCents: 5499,
      initialStock: 18,
      stock: 18,
      category: 'Accesorios',
      color: [45, 55, 65],
    },
    {
      name: 'Reloj Deportivo',
      description: 'Reloj resistente al agua con cronometro',
      basePriceCents: 7999,
      initialStock: 8,
      stock: 8,
      category: 'Accesorios',
      color: [20, 90, 120],
    },
    {
      name: 'Zapatillas Urbanas',
      description: 'Zapatillas comodas para uso diario',
      basePriceCents: 7499,
      initialStock: 12,
      stock: 12,
      category: 'Calzado',
      color: [210, 210, 205],
    },
  ];

  for (const p of sellerAProducts) await upsertProduct(sellerA.id, p);
  for (const p of sellerBProducts) await upsertProduct(sellerB.id, p);
  for (const p of sellerCProducts) await upsertProduct(sellerC.id, p);

  console.log('Seeding a cart for buyer1...');
  const jean = await prisma.product.findFirst({ where: { sellerId: sellerA.id, name: 'Jean Slim Fit Azul' } });
  const cargador = await prisma.product.findFirst({ where: { sellerId: sellerB.id, name: 'Cargador Rapido USB-C 65W' } });
  if (jean) {
    await prisma.cartItem.upsert({
      where: { buyerId_productId: { buyerId: buyerA.id, productId: jean.id } },
      update: { quantity: 1 },
      create: { buyerId: buyerA.id, productId: jean.id, quantity: 1 },
    });
  }
  if (cargador) {
    await prisma.cartItem.upsert({
      where: { buyerId_productId: { buyerId: buyerA.id, productId: cargador.id } },
      update: { quantity: 2 },
      create: { buyerId: buyerA.id, productId: cargador.id, quantity: 2 },
    });
  }

  console.log('Seeding an order history entry for buyer2...');
  const auriculares = await prisma.product.findFirst({ where: { sellerId: sellerB.id, name: 'Auriculares Inalambricos Pro' } });
  if (auriculares) {
    const existingOrder = await prisma.order.findFirst({ where: { buyerId: buyerB.id } });
    if (!existingOrder) {
      const order = await prisma.order.create({
        data: { buyerId: buyerB.id, totalAmountCents: auriculares.basePriceCents },
      });
      const suborder = await prisma.suborder.create({
        data: {
          orderId: order.id,
          sellerId: sellerB.id,
          subtotalCents: auriculares.basePriceCents,
          status: 'SHIPPED',
        },
      });
      await prisma.orderItem.create({
        data: {
          suborderId: suborder.id,
          productId: auriculares.id,
          quantity: 1,
          unitPriceAtPurchaseCents: auriculares.basePriceCents,
        },
      });
    }
  }

  console.log('\nDone. Test credentials (password for all: ' + TEST_PASSWORD + '):');
  console.log('  SELLER  seller1@test.com  (Elena Torres - Ropa/Accesorios)');
  console.log('  SELLER  seller2@test.com  (Carlos Ruiz - Electronica/Accesorios)');
  console.log('  SELLER  vendedor.prueba@example.com  (Vendedor Prueba - Electronica/Ropa/Accesorios/Calzado)');
  console.log('  BUYER   buyer1@test.com   (Ana Gomez - has items in cart)');
  console.log('  BUYER   buyer2@test.com   (Luis Fernandez - has an order in history)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
