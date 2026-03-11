/**
 * attribute-types.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Tipos dinâmicos de variação de produto.
 * Exemplos de registros:
 *   { name: "size",     label: "Tamanho", displayType: "selector" }
 *   { name: "color",    label: "Cor",     displayType: "swatch"   }
 *   { name: "material", label: "Material",displayType: "dropdown" }
 *
 * Os valores dos atributos ficam no JSONB de product_variants.
 * ─────────────────────────────────────────────────────────────
 */

import { pgEnum, pgTable, smallint, text, varchar } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

// ── Enum ──────────────────────────────────────────────────────
export const attributeDisplayTypeEnum = pgEnum('attribute_display_type_enum', [
    'selector', // botões S / M / L / XL
    'swatch', // círculo de cor com hexColor
    'dropdown', // select dropdown
]);

// ── Table ─────────────────────────────────────────────────────
export const attributeTypes = pgTable('attribute_types', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    name: varchar('name', { length: 50 }).notNull().unique(),
    label: varchar('label', { length: 80 }).notNull(),
    displayType: attributeDisplayTypeEnum('display_type').notNull(),
    sortOrder: smallint('sort_order').notNull().default(0),
});

// ── Types ─────────────────────────────────────────────────────
export type AttributeType = typeof attributeTypes.$inferSelect;
export type NewAttributeType = typeof attributeTypes.$inferInsert;
