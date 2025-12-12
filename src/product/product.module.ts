import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService,InventoryService, PrismaService],
})
export class ProductModule {}
