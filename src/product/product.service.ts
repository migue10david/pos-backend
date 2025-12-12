import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InventoryService } from 'src/inventory/inventory.service';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService, @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,) {}

  async create(dto: CreateProductDto) {
    const product = await this.prisma.product.create({ data: dto });
    if(product){
      await this.inventoryService.createMovement({
        productId: product.id,
        type: 'IN',
        quantity: product.stock,
        unitCost: product.cost,
      });
    }

    return product;

  }

 async findAll(
  page: number = 1,
  limit: number = 10,
  name?: string,
  minPrice?: number,
  maxPrice?: number,
) {
  const skip = (page - 1) * limit;

  // Construimos filtros dinámicamente
  const where: any = {};

  if (name) {
    where.name = {
      contains: name,
      mode: 'insensitive',
    };
  }

  if (minPrice) {
    where.price = { ...(where.price || {}), gte: minPrice };
  }

  if (maxPrice) {
    where.price = { ...(where.price || {}), lte: maxPrice };
  }

  const [products, total] = await Promise.all([
    this.prisma.product.findMany({
      skip,
      take: limit,
      where,               // 👈 Filtros aplicados
      orderBy: { name: 'asc' },
    }),
    this.prisma.product.count({ where }),
  ]);

  return {
    data: products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
  async lowStock(threshold = 5) {
    const products = await this.prisma.product.findMany({
      where: { stock: { lt: threshold } },
      orderBy: { stock: 'asc' },
    });
    return products;
  }


  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) throw new NotFoundException('Producto no encontrado');

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (!product) throw new NotFoundException('Producto no encontrado');
    
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    if (!product) throw new NotFoundException('Producto no encontrado');

    return this.prisma.product.delete({ where: { id } });
  }
}
