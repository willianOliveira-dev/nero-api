import nodemailer from 'nodemailer';
import { env } from '@/config/env.js';

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

interface SendMailOptions {
    to: string;
    subject: string;
    html: string;
}

export async function sendMail({ to, subject, html }: SendMailOptions) {
    try {
        await transporter.sendMail({
            from: env.SMTP_FROM,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        throw error;
    }
}


export async function sendVerificationOTPMail(email: string, otp: string, type: string) {
    const subject = type === 'sign-in' ? 'Código de Login' : 'Verificação de Email';

    await sendMail({
        to: email,
        subject: `Nero - ${subject}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #d70040, #A2002A); padding: 40px 20px; text-align: center; border-radius: 0 0 30px 30px;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0; letter-spacing: 2px;">NERO</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px;">${subject}</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="color: #333; font-size: 16px; margin-bottom: 10px;">Aqui está o seu código de verificação:</p>
                    <div style="background-color: #f8f8f8; padding: 20px; border-radius: 12px; margin: 25px 0; border: 2px dashed #d70040;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #d70040;">${otp}</span>
                    </div>
                    <p style="color: #888; font-size: 13px;">Este código expira em <strong>5 minutos</strong>.</p>
                    <p style="color: #aaa; font-size: 12px; margin-top: 30px;">Se você não solicitou este código, pode ignorar este email.</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Nero. Todos os direitos reservados.</p>
                </div>
            </div>
        `,
    });
}

export async function sendResetPasswordMail(userName: string, userEmail: string, resetUrl: string) {
    await sendMail({
        to: userEmail,
        subject: 'Nero - Redefinir Senha',
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
                <div style="background: linear-gradient(135deg, #d70040, #A2002A); padding: 40px 20px; text-align: center; border-radius: 0 0 30px 30px;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0; letter-spacing: 2px;">NERO</h1>
                    <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin-top: 8px;">Redefinição de Senha</p>
                </div>
                <div style="padding: 40px 30px; text-align: center;">
                    <p style="color: #333; font-size: 16px;">Olá <strong>${userName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; margin-top: 10px;">Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #d70040, #A2002A); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin: 25px 0;">Redefinir Senha</a>
                    <p style="color: #aaa; font-size: 12px; margin-top: 30px;">Se você não solicitou isso, pode ignorar este email com segurança.</p>
                </div>
                <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="color: #aaa; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Nero. Todos os direitos reservados.</p>
                </div>
            </div>
        `,
    });
}
