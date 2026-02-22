import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3001',
  mobileDeepLinkPrefix: process.env.MOBILE_DEEP_LINK_PREFIX || 'dblock://',
}));

export const databaseConfig = registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'dblock',
  password: process.env.DB_PASSWORD || 'dblock_dev',
  name: process.env.DB_NAME || 'dblock_workspace',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret',
  expiration: process.env.JWT_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const integrationConfig = registerAs('integrations', () => ({
  bogIpay: {
    mode: process.env.BOG_IPAY_MODE || 'mock',
    clientId: process.env.BOG_IPAY_CLIENT_ID || '',
    secretKey: process.env.BOG_IPAY_SECRET_KEY || '',
    baseUrl: process.env.BOG_IPAY_BASE_URL || 'https://ipay.ge/opay/api/v1',
    redirectUrl: process.env.BOG_IPAY_REDIRECT_URL || '',
  },
  tbcTpay: {
    mode: process.env.TBC_TPAY_MODE || 'mock',
    clientId: process.env.TBC_TPAY_CLIENT_ID || '',
    clientSecret: process.env.TBC_TPAY_CLIENT_SECRET || '',
    baseUrl: process.env.TBC_TPAY_BASE_URL || 'https://api.tbcbank.ge',
  },
  saltoKs: {
    mode: process.env.SALTOKS_MODE || 'mock',
    clientId: process.env.SALTOKS_CLIENT_ID || '',
    clientSecret: process.env.SALTOKS_CLIENT_SECRET || '',
    baseUrl: process.env.SALTOKS_BASE_URL || 'https://api.eu.my-clay.com',
  },
  businessCentral: {
    mode: process.env.BC_MODE || 'mock',
    tenantId: process.env.BC_TENANT_ID || '',
    clientId: process.env.BC_CLIENT_ID || '',
    clientSecret: process.env.BC_CLIENT_SECRET || '',
    environment: process.env.BC_ENVIRONMENT || 'sandbox',
    companyId: process.env.BC_COMPANY_ID || '',
  },
  email: {
    mode: process.env.EMAIL_MODE || 'mock',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@dblock.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'D Block Workspace',
  },
  docusign: {
    mode: process.env.DOCUSIGN_MODE || 'mock',
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
    secretKey: process.env.DOCUSIGN_SECRET_KEY || '',
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
  },
}));
