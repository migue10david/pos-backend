import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Filters, Pagination } from 'src/utils/QueryBuilder';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  getAllOrders(@Query() pagination: Pagination, @Query() filters: Filters) {
    return this.orderService.getAllOrders({ pagination, filters });
  }

  @Get('total-day')
  getTotalMoneyOfDay() {
    return this.orderService.getTotalMoneyOfDay();
  }
  @Get('total-month')
  getTotalMoneyOfMonth() {
    return this.orderService.getTotalMoneyOfMonth();
  }

  @Get('popular-products-month')
  getPopularProductsOfMonth() {
    return this.orderService.getPopularProductsOfMonth();
  }

  @UseGuards(JwtGuard)
  @Post()
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser('id') id: string) {
    return this.orderService.create(dto, id);
  }

  @Get(':id')
  getOrderById(@Param('id') id: string) {
    return this.orderService.getOrderById(id);
  }

  @UseGuards(JwtGuard)
  @Patch(':id')
  updateOrderStatus(@Param('id') id: string) {
    return this.orderService.updateOrderStatus(id);
  }
}
