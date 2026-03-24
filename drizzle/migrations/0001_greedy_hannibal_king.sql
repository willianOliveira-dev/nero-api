ALTER TABLE "payment_methods" DROP CONSTRAINT "payment_methods_fingerprint_unique";--> statement-breakpoint
DROP INDEX "idx_payment_methods_fingerprint";--> statement-breakpoint
CREATE UNIQUE INDEX "unq_payment_methods_user_fingerprint" ON "payment_methods" USING btree ("user_id","fingerprint");