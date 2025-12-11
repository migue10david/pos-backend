import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class CreateOrderDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  items: CreateOrderItemDto[];

    @IsNotEmpty()
  payMethod: 'CASH' | 'TRANSFER';
}
