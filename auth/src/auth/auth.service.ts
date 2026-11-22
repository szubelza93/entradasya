import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { db } from '../prisma/db.js';
import * as bcrypt from 'bcrypt';
import { isUserRole, RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const role = dto.role ?? 'cliente';
    if (!isUserRole(role)) {
      throw new BadRequestException('El rol debe ser cliente, organizador o portero');
    }

    const existing = await db.orm.public.User.where({ email: dto.email }).first();
    if (existing) throw new ConflictException('El email ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await db.orm.public.User.create({
      name: dto.name,
      email: dto.email,
      password: hashed,
      role,
    });

    return this.signToken(user);
  }

  async login(dto: LoginDto) {
    const user = await db.orm.public.User.where({ email: dto.email }).first();
    if (!user?.password) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.signToken(user);
  }

  private signToken(user: { id: number; email: string; role: string; name: string | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    return {
      token: this.jwt.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }
}