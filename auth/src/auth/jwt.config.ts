import 'dotenv/config';
import type { JwtSignOptions } from '@nestjs/jwt';

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error('JWT_SECRET debe estar definido en el entorno.');
}

const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
if (!/^[1-9]\d*(?:ms|s|m|h|d|w|y)$/.test(expiresIn)) {
  throw new Error('JWT_EXPIRES_IN debe ser una duración, por ejemplo 7d o 12h.');
}

export const jwtConfig = {
  secret,
  expiresIn: expiresIn as JwtSignOptions['expiresIn'],
};
