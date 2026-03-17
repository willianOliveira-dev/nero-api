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
     * Converte decimal (reais) para inteiro (centavos) — para inserção no banco.
     * Price.toInt(129.90) → 12990
     * Price.toInt(null)   → null
     */
    static toInt(value: number): number;
    static toInt(value: number | null | undefined): number | null;
    static toInt(value: number | null | undefined): number | null {
        if (value == null) {
            return null;
        }
        return Math.round(value * 100);
    }

    /**
     * Converte centavos (number ou string do PG) para decimal.
     * Price.fromCents(12990)   → 129.90
     * Price.fromCents("12990") → 129.90
     */
    static fromCents(value: number | string | null | undefined): number | null {
        if (value == null) {
            return null;
        }
        return Number(value) / 100;
    }

    /**
     * Formata centavos para string de exibição.
     * Price.format(12990)   → "R$ 129,90"
     * Price.format("12990") → "R$ 129,90"
     */
    static format(value: number | string | null | undefined): string | null {
        if (value == null) {
            return null;
        }
        return formatter.format(Number(value) / 100);
    }

    /**
     * Constrói PriceOutput a partir de centavos (number ou string).
     * Price.toOutput(12990) → { cents: 12990, value: 129.90, formatted: "R$ 129,90" }
     */
    static toOutput(cents: number | string): PriceOutput {
        const numeric = Number(cents);
        return {
            cents: numeric,
            value: numeric / 100,
            formatted: formatter.format(numeric / 100),
        };
    }

    /**
     * Constrói ProductPriceOutput completo.
     * Aceita centavos como number (integer do PG) ou string.
     */
    static toProductOutput(
        basePrice: number | string,
        originalPrice: number | string | null | undefined,
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

    /**
     * @deprecated Use Price.toInt() instead.
     * Mantido temporariamente para compatibilidade.
     */
    static toCents(value: number): string;
    static toCents(value: number | null | undefined): string | null;
    static toCents(value: number | null | undefined): string | null {
        if (value == null) {
            return null;
        }
        return String(Math.round(value * 100));
    }
}
