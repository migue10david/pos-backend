import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/user/dto/create-user-dto';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { SignInDto } from './dto/sign-in-dto';
import { verify } from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateLocalUser({ email, password }: SignInDto) {
    const user = await this.userService.findByEmail(email);

    if (!user) throw new UnauthorizedException('User not found');

    if (!user.password) throw new UnauthorizedException('Invalid credentials');

    const passwordMatched = await verify(user.password, password);

    if (!passwordMatched) throw new UnauthorizedException('Invalid password');

    return user;
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.register(createUserDto);
    const { accessToken, refreshToken } = this.generateToken(user.id);
    return { user, accessToken, refreshToken };
  }

  async login(SignInDto: SignInDto) {
    const { email, password } = SignInDto;
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('No existe el usuario');
    }
    const validPassword = await this.userService.validPassword(
      user.password,
      password
    );
    if (!validPassword) {
      throw new Error('Contraseña incorrecta');
    }
    const { accessToken, refreshToken } = this.generateToken(user.id);
    return { user, accessToken, refreshToken };
  }

  private generateToken(id: string) {
    const payload: JwtPayload = {
      sub: id,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  async validateJwtUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const currentUser = { id: userId , role: user.role };
    return currentUser;
  }
}
