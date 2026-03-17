TRUNCATE TABLE "home_sections";

ALTER TABLE "home_sections" DROP COLUMN "type";

DROP TYPE "public"."home_section_type_enum";

CREATE TYPE "public"."home_section_type_enum" AS ENUM(
    'top_selling',
    'new_in',
    'on_sale',
    'free_shipping',
    'by_gender',
    'category_list',
    'banner'
);

ALTER TABLE "home_sections" ADD COLUMN "type" "public"."home_section_type_enum" NOT NULL;