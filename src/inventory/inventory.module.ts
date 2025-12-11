import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProductService } from 'src/product/product.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService,ProductService],
})
export class InventoryModule {}
