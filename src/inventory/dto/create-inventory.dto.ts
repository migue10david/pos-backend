export class CreateInventoryDto {

    productId: string;
    quantity: number;
    type: 'IN' | 'OUT';
    unitCost: number;
}
