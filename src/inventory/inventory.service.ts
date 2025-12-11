import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovementType } from '@prisma/client';
import { ProductService } from 'src/product/product.service';
import { Filters, Pagination } from 'src/utils/QueryBuilder';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly productService: ProductService,
  ) {}

  async createMovementAndApplyStock(dto: CreateInventoryDto) {
    return this.prismaService.$transaction(async (tx) => {
      const product = await this.productService.findOne(dto.productId);
      if (!product) throw new NotFoundException('Product not found');

      if (dto.type === MovementType.OUT && product.stock < dto.quantity) {
        throw new BadRequestException('Not enough stock');
      }

      const movement = await tx.inventoryMovement.create({
        data: { ...dto, unitCost: dto.unitCost ?? product.cost },
      });

      // apply stock change
      if (dto.type === MovementType.IN) {
        await tx.product.update({
          where: { id: dto.productId },
          data: { stock: { increment: dto.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: dto.productId },
          data: { stock: { decrement: dto.quantity } },
        });
      }

      return movement;
    });
  }

  async findAll({
    pagination,
    filters,
  }: {
    pagination?: Pagination;
    filters?: Filters;
  }) {
    const page = pagination?.page && pagination.page > 0 ? pagination.page : 1;
    const limit =
      pagination?.limit && pagination.limit > 0
        ? Math.min(pagination.limit, 100)
        : 20;

    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.type) {
      where.type = {
        equals: filters.type,
      };
    }
    if (filters?.createdAt) {
      const date = new Date(filters.createdAt);
      if (isNaN(date.getTime())) {
        throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
      }

      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [data, total] = await Promise.all([
      this.prismaService.inventoryMovement.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.inventoryMovement.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

async inventoryValue() {
    const values = await this.prismaService.product.findMany({
      select: { id: true, name: true, stock: true, cost: true, price: true },
      where: { stock: {gt: 0} },
    });

    const result = values.map(p => {
      const unit = p.cost ?? p.price ?? 0;
      return { id: p.id, name: p.name, stock: p.stock, unit, value: unit * p.stock };
    });

    const total = result.reduce((acc, r) => acc + r.value, 0);

    return { total};
  }

  findOne(id: number) {
    return `This action returns a #${id} inventory`;
  }

  update(id: number, updateInventoryDto: UpdateInventoryDto) {
    return `This action updates a #${id} inventory`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventory`;
  }
}
