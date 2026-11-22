import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
  console.log(`Auth service corriendo en http://localhost:${process.env.PORT || 3001}`);
}
void bootstrap().catch((error: unknown) => {
  console.error('Auth service failed to start', error);
  process.exitCode = 1;
});