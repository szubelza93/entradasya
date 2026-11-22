import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { db } from './prisma/db.js';

@Controller()
export class HealthController {
  @Get('health')
  async check() {
    const timestamp = new Date().toISOString();

    try {
      await db.orm.public.User.where({
        email: 'health-check@entradasya.invalid',
      }).first();

      return {
        service: 'auth',
        status: 'ok',
        checks: { database: 'ok' },
        timestamp,
      };
    } catch (error) {
      console.error('Auth health check failed:', error);
      throw new ServiceUnavailableException({
        service: 'auth',
        status: 'error',
        checks: { database: 'error' },
        timestamp: new Date().toISOString(),
      });
    }
  }
}
