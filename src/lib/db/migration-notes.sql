-- ─────────────────────────────────────────────────────────────
-- MIGRATION NOTES — SQL manual após gerar migration base com Drizzle Kit
-- Execute estes comandos APÓS o `drizzle-kit generate` para
-- adicionar features que o Drizzle Kit não gera automaticamente.
-- ─────────────────────────────────────────────────────────────

-- ══════════════════════════════════════════════════════════════
-- 1. FULL-TEXT SEARCH — products.search_vector
-- ══════════════════════════════════════════════════════════════
-- Adicionar coluna GENERATED ALWAYS AS (tsvector):
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

-- Índice GIN para busca full-text:
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN(search_vector);


-- ══════════════════════════════════════════════════════════════
-- 2. PARTIAL INDEX — On Sale
-- ══════════════════════════════════════════════════════════════
-- Apenas produtos em promoção (menor footprint, mais rápido):
CREATE INDEX IF NOT EXISTS idx_products_on_sale
  ON products(id, base_price)
  WHERE original_price IS NOT NULL;


-- ══════════════════════════════════════════════════════════════
-- 3. PARTIAL INDEX — Active products
-- ══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_products_active
  ON products(created_at DESC, id)
  WHERE status = 'active';


-- ══════════════════════════════════════════════════════════════
-- 4. UPDATED_AT TRIGGERS (auto-update timestamp)
-- ══════════════════════════════════════════════════════════════
-- Função reutilizável:
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em todas as tabelas com updated_at:
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_home_sections_updated_at
  BEFORE UPDATE ON home_sections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ══════════════════════════════════════════════════════════════
-- 5. SELF-REFERENCING FK — categories.parent_id
-- ══════════════════════════════════════════════════════════════
-- Drizzle não gera self-ref FK automaticamente neste caso.
-- Verificar se a migration gerada já inclui. Se não:
ALTER TABLE categories
  ADD CONSTRAINT fk_categories_parent
  FOREIGN KEY (parent_id)
  REFERENCES categories(id)
  ON DELETE SET NULL;


-- ══════════════════════════════════════════════════════════════
-- 6. PRODUCT REVIEWS → ORDERS FK
-- ══════════════════════════════════════════════════════════════
-- FK de product_reviews.order_id para orders.id:
ALTER TABLE product_reviews
  ADD CONSTRAINT fk_reviews_order_id
  FOREIGN KEY (order_id)
  REFERENCES orders(id)
  ON DELETE SET NULL;


-- ══════════════════════════════════════════════════════════════
-- 7. SEED — home_sections iniciais
-- ══════════════════════════════════════════════════════════════
INSERT INTO home_sections (slug, title, type, sort_order, is_active, filter_json)
VALUES
  ('top-selling', 'Top Selling', 'product_list', 1, true,
   '{"sort":"recommended","limit":10}'),
  ('new-in',      'New In',      'product_list', 2, true,
   '{"sort":"newest","limit":10,"daysAgo":30}')
ON CONFLICT (slug) DO NOTHING;
