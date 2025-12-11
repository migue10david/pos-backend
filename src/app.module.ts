import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { OrderModule } from './order/order.module';
import { InventoryModule } from './inventory/inventory.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UserModule,
    ProductModule,
    AuthModule,
    OrderModule,
    InventoryModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
