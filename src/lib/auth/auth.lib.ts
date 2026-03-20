import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI, emailOTP } from 'better-auth/plugins';
import { localization } from 'better-auth-localization';
import { env } from '@/config/env.js';
import { db } from '@/lib/db/connection';
import * as schema from '@/lib/db/schemas/index.schema';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

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
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
            try {
                await resend.emails.send({
                    from: 'Nero <onboarding@resend.dev>',
                    to: user.email,
                    subject: 'Nero - Redefinir Senha',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>Redefinição de Senha</h2>
                            <p>Olá ${user.name},</p>
                            <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova:</p>
                            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #d70040; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px;">Redefinir Senha</a>
                            <p style="margin-top: 20px; color: #666; font-size: 14px;">Se você não solicitou isso, pode ignorar este email.</p>
                        </div>
                    `,
                });
            } catch {
                console.log('Erro ao enviar email de redefinição de senha');
            }
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
                const subject = type === 'sign-in' ? 'Código de Login' : 'Verificação de Email';
                try {
                    await resend.emails.send({
                        from: 'Nero <onboarding@resend.dev>',
                        to: email,
                        subject: `Nero - ${subject}`,
                        html: `
                            <div style="font-family: sans-serif; padding: 20px;">
                                <h2>Bem-vindo(a) à Nero!</h2>
                                <p>Aqui está o seu código de verificação:</p>
                                <div style="background-color: #f4f4f4; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d70040;">${otp}</span>
                                </div>
                                <p style="color: #666; font-size: 14px;">Este código expira em 5 minutos.</p>
                            </div>
                        `,
                    });
                } catch {
                    console.log('Erro ao enviar email de verificação');
                }
            },
        }),
    ],
});
