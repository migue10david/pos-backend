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
