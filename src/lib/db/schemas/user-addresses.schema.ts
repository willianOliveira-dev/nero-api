import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';


export const userAddresses = pgTable(
    'user_addresses',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        label: varchar('label', { length: 50 }),
        recipientName: varchar('recipient_name', { length: 150 }).notNull(),
        street: varchar('street', { length: 255 }).notNull(),
        city: varchar('city', { length: 120 }).notNull(),
        state: varchar('state', { length: 100 }).notNull(),
        zipCode: varchar('zip_code', { length: 10 }).notNull(),
        country: varchar('country', { length: 2 }).notNull().default('US'),
        complement: varchar('complement', { length: 100 }),
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [index('idx_user_addresses_user_id').on(t.userId)],
);


export type UserAddress = typeof userAddresses.$inferSelect;
export type NewUserAddress = typeof userAddresses.$inferInsert;
