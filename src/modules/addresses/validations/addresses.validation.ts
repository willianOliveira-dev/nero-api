import { z } from 'zod';

const addressBaseSchema = z.object({
    label: z.string().max(50, 'Rótulo muito longo.').optional().nullable(),
    recipientName: z
        .string()
        .min(2, 'Nome deve ter ao menos 2 caracteres.')
        .max(150, 'Nome muito longo.')
        .nonempty('Nome do destinatário é obrigatório.'),

    street: z
        .string()
        .min(3, 'Logradouro inválido.')
        .max(255, 'Logradouro muito longo.')
        .nonempty('Logradouro é obrigatório.'),

    city: z
        .string()
        .min(2, 'Cidade inválida.')
        .max(120, 'Cidade muito longa.')
        .nonempty('Cidade é obrigatório.'),

    state: z
        .string()
        .min(2, 'Estado inválido.')
        .max(100, 'Estado muito longo.')
        .nonempty('Estado é obrigatório.'),

    zipCode: z
        .string()
        .regex(/^\d{5}(-\d{3})?$|^\d{8}$/, 'CEP inválido.')
        .nonempty('CEP é obrigatório.'),

    country: z
        .string()
        .length(2, 'País deve ser um código ISO de 2 letras (ex: US, BR).')
        .toUpperCase()
        .default('BR'),

    complement: z
        .string()
        .max(100, 'Complemento muito longo.')
        .optional()
        .nullable(),
});


export const createAddressSchema = addressBaseSchema;


export const updateAddressSchema = addressBaseSchema.partial();


export const addressParamsSchema = z.object({
    id: z.string().uuid({ message: 'id inválido.', version: 'v7' }),
});


export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
export type AddressParams = z.infer<typeof addressParamsSchema>;
