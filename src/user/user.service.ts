import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user-dto';
import { hash, verify } from 'argon2';

@Injectable()
export class UserService {

    constructor(private readonly prismaService: PrismaService) {}

    async register(createUserDto: CreateUserDto){
        const userExists = await this.findByEmail(createUserDto.email);
        console.log(userExists);
        if(userExists?.email === createUserDto.email){
            throw new ConflictException('El usuario ya existe');
        }
        const hashedPassword = await hash(createUserDto.password);
        const user = await this.prismaService.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password: hashedPassword,
            }
        });
        return user;
    }

    async findByEmail(email: string) {
        return this.prismaService.user.findUnique({
            where: {
                email: email,
            },
        });
    }

    async findById(id: string) {
        return this.prismaService.user.findUnique({
            where: {
                id: id,
            },
        });
    }

    async validPassword( hashedPassword: string, password: string) {
        return await verify(hashedPassword,password);
    }
}
