import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    BASE_URL: z.string().default('http://localhost:8000'),
    CLOUDINARY_CLOUD_NAME: z.string(),
    CLOUDINARY_API_KEY: z.string(),
    CLOUDINARY_API_SECRET: z.string(),
    PORT: z.coerce.number().default(3333),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string(),
    API_VERSION: z.string(),
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
        .default('info'),
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().default('http://localhost:8000'),
    ALLOWED_ORIGINS: z
        .string()
        .default('http://localhost:3000')
        .transform((val) => val.split(',').map((origin) => origin.trim())),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    PRICE_LOCALE: z.string().default('pt-BR'),
    PRICE_CURRENCY: z.string().default('BRL'),
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_CURRENCY: z.string().default('brl'),
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string(),
    SMTP_PASS: z.string(),
    SMTP_FROM: z.string(),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
