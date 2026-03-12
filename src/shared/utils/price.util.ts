import { env } from '@/config/env';

export type PriceOutput = {
    cents: number;
    value: number;
    formatted: string;
};

export type ProductPriceOutput = {
    current: PriceOutput;
    original: PriceOutput | null;
    discountPercent: number | null;
};

const LOCALE = env.PRICE_LOCALE ?? 'pt-BR';
const CURRENCY = env.PRICE_CURRENCY ?? 'BRL';

const formatter = new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: 2,
});

export class Price {
    /**
     * Converte decimal para centavos
     * Price.toCents(29.99) → "2999"
     * Price.toCents(null)  → null
     */
    static toCents(value: number): string;
    static toCents(value: number | null | undefined): string | null;
    static toCents(value: number | null | undefined): string | null {
        if (value == null) {
            return null;
        }
        return String(Math.round(value * 100));
    }

    /**
     * Converte centavos (string do PG) para decimal.
     * Price.fromCents("2999") → 29.99
     * Price.fromCents(null)   → null
     */
    static fromCents(value: string | null | undefined): number | null {
        if (value == null) {
            return null;
        }
        return Number(value) / 100;
    }

    /**
     * Formata centavos para string de exibição.
     * Price.format("2999") → "$29.99"
     * Price.format(null)   → null
     */
    static format(value: string | null | undefined): string | null {
        if (value == null) {
            return null;
        }
        return formatter.format(Number(value) / 100);
    }

    /**
     * Constrói o objeto PriceOutput completo a partir de centavos.
     */
    static toOutput(cents: string): PriceOutput {
        const numeric = Number(cents);
        return {
            cents: numeric,
            value: numeric / 100,
            formatted: formatter.format(numeric / 100),
        };
    }

    /**
     * Constrói o objeto ProductPriceOutput completo.
     * Inclui preço atual, original e percentual de desconto.
     *
     * Exemplo de retorno quando há promoção:
     * {
     *   current:  { cents: 2399, value: 23.99, formatted: "$23.99" },
     *   original: { cents: 2999, value: 29.99, formatted: "$29.99" },
     *   discountPercent: 20
     * }
     *
     * Exemplo sem promoção:
     * {
     *   current:  { cents: 2999, value: 29.99, formatted: "$29.99" },
     *   original: null,
     *   discountPercent: null
     * }
     *
     * @param basePrice     Preço atual em centavos (string do PG)
     * @param originalPrice Preço antes da promoção em centavos (string | null)
     */
    static toProductOutput(
        basePrice: string,
        originalPrice: string | null | undefined,
    ): ProductPriceOutput {
        const current = Price.toOutput(basePrice);

        if (!originalPrice) {
            return { current, original: null, discountPercent: null };
        }

        const original = Price.toOutput(originalPrice);
        const discountPercent = Math.round(
            ((Number(originalPrice) - Number(basePrice)) /
                Number(originalPrice)) *
                100,
        );

        return { current, original, discountPercent };
    }
}


