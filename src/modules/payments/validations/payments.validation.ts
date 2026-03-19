import { z } from 'zod';

export const paymentMethodParamsSchema = z.object({
    id: z.string().uuid('ID do método de pagamento inválido.'),
});

export const createPaymentIntentBodySchema = z.object({
    shippingAddressId: z.string().uuid('ID do endereço de envio inválido.'),
    paymentMethodId: z.string().uuid('ID do método de pagamento inválido.'),
    couponCode: z.string().optional(),
});

export type PaymentMethodParams = z.infer<typeof paymentMethodParamsSchema>;
export type CreatePaymentIntentBody = z.infer<typeof createPaymentIntentBodySchema>;
