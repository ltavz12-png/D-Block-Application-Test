import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      process.env.ADMIN_URL || 'http://localhost:3001',
      process.env.APP_URL || 'http://localhost:3000',
    ],
    credentials: true,
  });

  // Global prefix
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('D Block Workspace API')
    .setDescription('API documentation for D Block Workspace platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & authorization')
    .addTag('users', 'User management')
    .addTag('locations', 'Location management')
    .addTag('resources', 'Resource management')
    .addTag('bookings', 'Booking operations')
    .addTag('payments', 'Payment processing')
    .addTag('passes', 'Pass & subscription management')
    .addTag('b2b', 'B2B corporate tenant management')
    .addTag('credits', 'Meeting room time credits')
    .addTag('accounting', 'Accounting & revenue recognition')
    .addTag('invoices', 'Invoice management')
    .addTag('access', 'Access control & SaltoKS')
    .addTag('visitors', 'Visitor management')
    .addTag('notifications', 'Notification management')
    .addTag('promotions', 'Promotions & promo codes')
    .addTag('calendars', 'Calendar integrations')
    .addTag('reports', 'Reports & analytics')
    .addTag('support', 'Support tickets')
    .addTag('admin', 'Admin operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`D Block API running on port ${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
