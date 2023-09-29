import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { PayloadToken } from '../models/token.model';
import * as bcryptjs from 'bcryptjs';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async register({ password, email, name, lastname, username }: RegisterDto) {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    await this.usersService.create({
      name,
      lastname,
      username,
      email,
      password: hashedPassword,
    });

    return {
      message: 'User created successfully',
    };
  }

  async login({ email, password }: LoginDto) {
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload: PayloadToken = { email: user.email, sub: user.id };

    const token = await this.jwtService.sign(payload);

    return {
      token: token,
      email: user.email,
    };
  }
}
