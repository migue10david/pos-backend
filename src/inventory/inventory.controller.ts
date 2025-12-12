import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Filters, Pagination } from 'src/utils/QueryBuilder';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createMovementAndApplyStock(
      createInventoryDto,
    );
  }

  @UseGuards(JwtGuard)
  @Post('create-movement')
  createMovement(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.createMovement(createInventoryDto);
  }

  @Get()
  findAll(@Query() pagination: Pagination, @Query() filters: Filters) {
    return this.inventoryService.findAll({ pagination, filters });
  }

  @Get('value')
  inventoryValue() {
    return this.inventoryService.inventoryValue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    return this.inventoryService.update(+id, updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(+id);
  }
}
