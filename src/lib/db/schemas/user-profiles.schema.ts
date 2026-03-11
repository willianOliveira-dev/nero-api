/**
 * user-profiles.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Extensão da tabela `user` do Better Auth.
 * Armazena dados extras: telefone, avatar, preferência de
 * gênero e o customer ID do Stripe.
 * Relação 1:1 com user.id
 * ─────────────────────────────────────────────────────────────
 */

import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';

// ── Enum ──────────────────────────────────────────────────────
export const genderPreferenceEnum = pgEnum('gender_preference_enum', [
    'men',
    'women',
    'kids',
    'unisex',
]);

// ── Table ─────────────────────────────────────────────────────
export const userProfiles = pgTable('user_profiles', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    userId: text('user_id')
        .notNull()
        .unique()
        .references(() => user.id, { onDelete: 'cascade' }),
    phone: text('phone'),
    avatarUrl: text('avatar_url'),
    genderPreference: genderPreferenceEnum('gender_preference'),
    stripeCustomerId: text('stripe_customer_id').unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
// ── Types ─────────────────────────────────────────────────────
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
