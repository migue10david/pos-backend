import { IsNumber, IsString, Max, Min } from "class-validator";

export class CreateProductDto {

    @IsString()
    name: string;
     @IsString()
    code: string;
    @IsNumber()
    @Min(1)
    price: number;
    @IsNumber()
    @Min(1)
    cost: number;
    @IsNumber()
    @Min(0)
    stock: number;
}
