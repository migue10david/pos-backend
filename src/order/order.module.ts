import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from 'src/product/product.service';
import { InventoryService } from 'src/inventory/inventory.service';

@Module({
  controllers: [OrderController],
  providers: [OrderService,PrismaService,ProductService , InventoryService],
})
export class OrderModule {}
