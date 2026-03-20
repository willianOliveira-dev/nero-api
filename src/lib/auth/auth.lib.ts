import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, emailOTP } from 'better-auth/plugins';
import { localization } from 'better-auth-localization';
import { env } from '@/config/env.js';
import { db } from '@/lib/db/connection';
import * as schema from '@/lib/db/schemas/index.schema';
import { sendResetPasswordMail, sendVerificationOTPMail } from '@/lib/mailer.js';

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        ...env.ALLOWED_ORIGINS,
        'nero://',
        ...(process.env.NODE_ENV !== 'production' ? [
            'exp://',
            'exp://**',
            'exp://192.168.*.*:*/**',
        ] : []),
    ],
    advanced: {
        disableOriginCheck: process.env.NODE_ENV !== 'production',
    },
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            await sendResetPasswordMail(user.name, user.email, url);
        },
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
    },
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: schema,
    }),
    plugins: [
        openAPI(),
        localization({ defaultLocale: 'pt-BR' }),
        emailOTP({
            otpLength: 6,
            expiresIn: 300,
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({ email, otp, type }) {
                await sendVerificationOTPMail(email, otp, type);
            },
        }),
    ],
});
