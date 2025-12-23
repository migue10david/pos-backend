import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ProductService } from 'src/product/product.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productService: ProductService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getAllOrders() {
    return this.prisma.order.findMany();
  }

  async getTotalMoneyOfDay() {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const salesToday = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfDay, lte: endOfDay },
        status: 'CONFIRMED',
      },
      _sum: { total: true },
      _count: true,
    });
    return salesToday;
  }

  async getTotalMoneyOfMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const orders = await this.prisma.order.findMany({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: 'CONFIRMED',
    },
    select: {
      total: true,
      createdAt: true,
    },
  });

    const data = new Map<string, number>();

  for (const order of orders) {
    const dayKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    data.set(dayKey, (data.get(dayKey) ?? 0) + order.total);
  }

  // Rellenar días sin ventas
  const result: { day: string; total: number }[] = [];
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(today.getFullYear(), today.getMonth(), day);
    const key = date.toISOString().split('T')[0];

    result.push({
      day: key,
      total: data.get(key) ?? 0,
    });
  }

  return result;
  }

async getPopularProductsOfMonth() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const items = await this.prisma.orderItem.findMany({
    where: {
      order: {
        status: 'CONFIRMED',
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    },
    include: {
      product: true,
    },
  });

  const data = new Map<string, { product: any; quantity: number }>();

  for (const item of items) {
    const productId = item.productId;

    if (!data.has(productId)) {
      data.set(productId, {
        product: item.product,
        quantity: 0,
      });
    }

    data.get(productId)!.quantity += item.quantity;
  }

  return Array.from(data.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5); // Top 5 productos
}

// async getPopularProductsOfMonths() {
//   const today = new Date();
//   const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//   const endOfMonth = new Date(
//     today.getFullYear(),
//     today.getMonth() + 1,
//     0,
//     23,
//     59,
//     59,
//     999
//   );

//   const grouped = await this.prisma.orderItem.groupBy({
//     by: ['productId'],
//     where: {
//       order: {
//         status: 'CONFIRMED',
//         createdAt: {
//           gte: startOfMonth,
//           lte: endOfMonth,
//         },
//       },
//     },
//     _sum: {
//       quantity: true,
//     },
//     orderBy: {
//       _sum: {
//         quantity: 'desc',
//       },
//     },
//     take: 5,
//   });

//   const products = await this.prisma.product.findMany({
//     where: {
//       id: { in: grouped.map(g => g.productId) },
//     },
//   });

//   return grouped.map(g => ({
//     product: products.find(p => p.id === g.productId),
//     quantity: g._sum.quantity,
//   }));
// }



  async create(dto: CreateOrderDto, userId: string) {
    const { items, payMethod } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const productIds = items.map((i) => i.productId);

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new NotFoundException('Some products do not exist');
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // Calcular items + total
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;

      return {
        product: { connect: { id: product.id } },
        quantity: item.quantity,
        price: product.price, // precio unitario
      };
    });

    const total = orderItems.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );

    // Crear la orden + items
    const order = await this.prisma.order.create({
      data: {
        userId,
        payMethod,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true, // para ver los items creados
      },
    });

    return order;
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrderStatus(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validamos stock antes de confirmar
    for (const item of order.items) {
      const product = await this.productService.findOne(item.productId);

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${product.name}. Available: ${product.stock}, Needed: ${item.quantity}`,
        );
      }
    }

    await Promise.all(
      order.items.map((item) =>
        this.inventoryService.createMovementAndApplyStock({
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          unitCost: item.price,
        }),
      ),
    );
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }
}
