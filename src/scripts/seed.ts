import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/config/env';
import { auth } from '../lib/auth/auth.lib';
import { brands } from '../lib/db/schemas/brands.schema';
import { cartItems, carts } from '../lib/db/schemas/carts.schema';
import { categories } from '../lib/db/schemas/categories.schema';
import { coupons } from '../lib/db/schemas/coupons.schema';
import { homeSections } from '../lib/db/schemas/home-sections.schema';
import * as schema from '../lib/db/schemas/index.schema';
import { productImages } from '../lib/db/schemas/product-images.schema';
import { productReviews } from '../lib/db/schemas/product-reviews.schema';
import { productSkus } from '../lib/db/schemas/product-skus.schema';
import { products } from '../lib/db/schemas/products.schema';
import { skuOptionMap } from '../lib/db/schemas/sku-option-map.schema';
import { userAddresses } from '../lib/db/schemas/user-addresses.schema';
import { userProfiles } from '../lib/db/schemas/user-profiles.schema';
import { variationOptions } from '../lib/db/schemas/variation-options.schema';
import { variationTypes } from '../lib/db/schemas/variation-types.schema';
import { wishlistItems, wishlists } from '../lib/db/schemas/wishlists.schema';
import { Price } from '../shared/utils/price.util';

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema });

const p = (reais: number) => Price.toInt(reais)!;

type VariationDef = {
    name: string;
    hasImage: boolean;
    options: { value: string; imageUrl?: string | null }[];
};

type SkuDef = {
    optionValues: string[];
    price: number;
    stock: number;
    skuCode: string;
};

async function createProductWithVariations(
    productId: string,
    variationDefs: VariationDef[],
    skuDefs: SkuDef[],
) {
    const optionIdMap = new Map<string, string>();

    for (let vtPos = 0; vtPos < variationDefs.length; vtPos++) {
        const vtDef = variationDefs[vtPos];
        const [vType] = await db
            .insert(variationTypes)
            .values({
                productId,
                name: vtDef.name,
                position: vtPos + 1,
                hasImage: vtDef.hasImage,
            })
            .returning();

        for (let optPos = 0; optPos < vtDef.options.length; optPos++) {
            const optDef = vtDef.options[optPos];
            const [option] = await db
                .insert(variationOptions)
                .values({
                    variationTypeId: vType.id,
                    value: optDef.value,
                    imageUrl: optDef.imageUrl ?? null,
                    position: optPos + 1,
                })
                .returning();
            optionIdMap.set(`${vtDef.name}:${optDef.value}`, option.id);
        }
    }

    const insertedSkus = [];
    for (const skuDef of skuDefs) {
        const [sku] = await db
            .insert(productSkus)
            .values({
                productId,
                price: p(skuDef.price),
                stock: skuDef.stock,
                skuCode: skuDef.skuCode,
            })
            .returning();

        for (let i = 0; i < skuDef.optionValues.length; i++) {
            const typeName = variationDefs[i].name;
            const optionValue = skuDef.optionValues[i];
            const optionId = optionIdMap.get(`${typeName}:${optionValue}`);
            if (!optionId) {
                throw new Error(
                    `Option "${optionValue}" not found for "${typeName}"`,
                );
            }

            await db.insert(skuOptionMap).values({
                skuId: sku.id,
                variationOptionId: optionId,
            });
        }
        insertedSkus.push(sku);
    }

    return insertedSkus;
}

const IMG = {
    tshirt_black:
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop',
    tshirt_white:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
    tshirt_grey:
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop',
    tshirt_navy:
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=800&fit=crop',
    tshirt_red:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop',
    tshirt_crop:
        'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&h=800&fit=crop',
    tshirt_polo:
        'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=800&h=800&fit=crop',
    tshirt_henley:
        'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&h=800&fit=crop',
    tshirt_long:
        'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=800&fit=crop',
    tshirt_graphic:
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=800&fit=crop',

    pants_cargo:
        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop',
    pants_chino:
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop',
    pants_jeans:
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop',
    pants_jogger:
        'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=800&h=800&fit=crop',
    pants_formal:
        'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=697&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',

    shoe_runner:
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop',
    shoe_runner2:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    shoe_casual:
        'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop',
    shoe_boot:
        'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&h=800&fit=crop',
    shoe_sandal:
        'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=800&fit=crop',
    shoe_loafer:
        'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&h=800&fit=crop',
    shoe_highttop:
        'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&h=800&fit=crop',

    jacket_bomber:
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop',
    jacket_wind:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop',
    jacket_denim:
        'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&h=800&fit=crop',
    jacket_leather:
        'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800&h=800&fit=crop',
    jacket_puffer:
        'https://images.unsplash.com/photo-1604644401890-0bd678c83788?w=800&h=800&fit=crop',

    cap_dad:
        'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop',
    cap_snapback:
        'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=800&h=800&fit=crop',
    bag_tote:
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    bag_backpack:
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    belt_leather:
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop',
    socks: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=800&h=800&fit=crop',
    wallet: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop',
    sunglasses:
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop',

    color_black:
        'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=100&h=100&fit=crop',
    color_white:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop',
    color_grey:
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=100&h=100&fit=crop',
    color_navy:
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=100&h=100&fit=crop',
    color_green:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop',
    color_red:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&h=100&fit=crop',
    color_brown:
        'https://images.unsplash.com/photo-1542272604-787c3835535d?w=100&h=100&fit=crop',
    color_blue:
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&h=100&fit=crop',
};

async function seed() {
    try {
        console.log('🌱 Iniciando seed...\n');

        console.log('🧹 Limpando banco...');
        await db.delete(cartItems);
        await db.delete(carts);
        await db.delete(wishlistItems);
        await db.delete(wishlists);
        await db.delete(productReviews);
        await db.delete(productImages);
        await db.delete(skuOptionMap);
        await db.delete(productSkus);
        await db.delete(variationOptions);
        await db.delete(variationTypes);
        await db.delete(products);
        await db.delete(userAddresses);
        await db.delete(userProfiles);
        await db.delete(categories);
        await db.delete(brands);
        await db.delete(coupons);
        await db.delete(homeSections);
        console.log('✅ Banco limpo.\n');

        console.log('🏷️  Inserindo marcas...');
        const insertedBrands = await db
            .insert(brands)
            .values([
                {
                    name: 'Nero Basics',
                    slug: 'nero-basics',
                    logoUrl: null,
                    isActive: true,
                },
                {
                    name: 'Nero Sport',
                    slug: 'nero-sport',
                    logoUrl: null,
                    isActive: true,
                },
                {
                    name: 'Nero Premium',
                    slug: 'nero-premium',
                    logoUrl: null,
                    isActive: true,
                },
                {
                    name: 'Nero Denim',
                    slug: 'nero-denim',
                    logoUrl: null,
                    isActive: true,
                },
                {
                    name: 'Nero Footwear',
                    slug: 'nero-footwear',
                    logoUrl: null,
                    isActive: true,
                },
            ])
            .returning();
        const brandMap = Object.fromEntries(
            insertedBrands.map((b) => [b.slug, b.id]),
        );
        console.log(`✅ ${insertedBrands.length} marcas inseridas.\n`);

        console.log('📁 Inserindo categorias...');
        const insertedCategories = await db
            .insert(categories)
            .values([
                {
                    name: 'Camisetas',
                    slug: 'camisetas',
                    parentId: null,
                    sortOrder: 1,
                    isActive: true,
                    iconUrl:
                        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=400&fit=crop',
                },
                {
                    name: 'Calças',
                    slug: 'calcas',
                    parentId: null,
                    sortOrder: 2,
                    isActive: true,
                    iconUrl:
                        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&h=400&fit=crop',
                },
                {
                    name: 'Calçados',
                    slug: 'calcados',
                    parentId: null,
                    sortOrder: 3,
                    isActive: true,
                    iconUrl:
                        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&h=400&fit=crop',
                },
                {
                    name: 'Jaquetas',
                    slug: 'jaquetas',
                    parentId: null,
                    sortOrder: 4,
                    isActive: true,
                    iconUrl:
                        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=400&fit=crop',
                },
                {
                    name: 'Acessórios',
                    slug: 'acessorios',
                    parentId: null,
                    sortOrder: 5,
                    isActive: true,
                    iconUrl:
                        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=400&fit=crop',
                },
            ])
            .returning();
        const catMap = Object.fromEntries(
            insertedCategories.map((c) => [c.slug, c.id]),
        );
        console.log(`✅ ${insertedCategories.length} categorias inseridas.\n`);

        console.log('🎟️  Inserindo cupons...');
        await db.insert(coupons).values([
            {
                code: 'BEMVINDO10',
                type: 'percentage',
                value: 10,
                minOrderValue: 10000,
                maxUses: 1000,
                usedCount: 0,
                expiresAt: new Date('2026-12-31'),
                isActive: true,
            },
            {
                code: 'FRETEGRATIS',
                type: 'free_shipping',
                value: 0,
                minOrderValue: 15000,
                maxUses: 500,
                usedCount: 0,
                expiresAt: new Date('2026-12-31'),
                isActive: true,
            },
            {
                code: 'NERO20',
                type: 'percentage',
                value: 20,
                minOrderValue: 20000,
                maxUses: 200,
                usedCount: 0,
                expiresAt: new Date('2026-11-30'),
                isActive: true,
            },
            {
                code: 'DESC50',
                type: 'fixed',
                value: 5000,
                minOrderValue: 30000,
                maxUses: 100,
                usedCount: 0,
                expiresAt: new Date('2026-06-30'),
                isActive: true,
            },
        ]);
        console.log('✅ Cupons inseridos.\n');

        console.log('👤 Criando usuários...');
        const userDefs = [
            {
                email: 'ana.silva@email.com',
                password: 'Senha123!',
                name: 'Ana Silva',
            },
            {
                email: 'joao.santos@email.com',
                password: 'Senha123!',
                name: 'João Santos',
            },
            {
                email: 'admin@nero.com',
                password: 'Admin123!',
                name: 'Admin Nero',
            },
        ];
        const users: { id: string; name: string; email: string }[] = [];
        for (const def of userDefs) {
            try {
                const res = await auth.api.signUpEmail({ body: def });
                users.push(
                    res.user as { id: string; name: string; email: string },
                );
                console.log(`  ✔ ${def.name} criado`);
            } catch {
                const [existing] = await db
                    .select()
                    .from(schema.user)
                    .where(eq(schema.user.email, def.email));
                if (existing) {
                    users.push(
                        existing as { id: string; name: string; email: string },
                    );
                    console.log(`  ↩ ${def.name} já existe`);
                }
            }
        }
        const [ana, joao] = users;
        console.log(`✅ ${users.length} usuários prontos.\n`);

        console.log('👤 Inserindo perfis e endereços...');
        await db
            .insert(userProfiles)
            .values([
                {
                    userId: ana.id,
                    genderPreference: 'women',
                    phone: '+55 11 91234-5678',
                },
                {
                    userId: joao.id,
                    genderPreference: 'men',
                    phone: '+55 11 98765-4321',
                },
                { userId: users[2].id, genderPreference: 'unisex' },
            ])
            .onConflictDoNothing();
        await db.insert(userAddresses).values([
            {
                userId: ana.id,
                label: 'Casa',
                recipientName: 'Ana Silva',
                street: 'Rua das Flores, 123',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567',
                country: 'BR',
                complement: 'Apto 45',
                isDefault: true,
            },
            {
                userId: ana.id,
                label: 'Trabalho',
                recipientName: 'Ana Silva',
                street: 'Av. Paulista, 1000',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01310-100',
                country: 'BR',
                complement: 'Sala 42',
                isDefault: false,
            },
            {
                userId: joao.id,
                label: 'Casa',
                recipientName: 'João Santos',
                street: 'Rua Augusta, 500',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01305-000',
                country: 'BR',
                complement: null,
                isDefault: true,
            },
        ]);
        console.log('✅ Perfis e endereços inseridos.\n');

        console.log('👕 Inserindo 50 produtos...');
        const insertedProducts = await db
            .insert(products)
            .values([
                {
                    name: 'Camiseta Oversized Cotton',
                    slug: 'camiseta-oversized-cotton',
                    hasVariations: true,
                    description:
                        'Camiseta oversized em algodão 100% orgânico. Corte relaxado, costuras reforçadas e toque ultra macio.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 245,
                    ratingAvg: '4.50',
                    ratingCount: 89,
                },

                {
                    name: 'Camiseta Basic Slim',
                    slug: 'camiseta-basic-slim',
                    hasVariations: true,
                    description:
                        'Camiseta slim fit para o dia a dia. Tecido respirável com elastano para maior conforto.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 412,
                    ratingAvg: '4.20',
                    ratingCount: 134,
                },

                {
                    name: 'Camiseta Cropped Feminina',
                    slug: 'camiseta-cropped-feminina',
                    hasVariations: true,
                    description:
                        'Camiseta cropped moderna com caimento perfeito. Ideal para looks casuais e esportivos.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 178,
                    ratingAvg: '4.70',
                    ratingCount: 56,
                },

                {
                    name: 'Polo Piqué Premium',
                    slug: 'polo-pique-premium',
                    hasVariations: true,
                    description:
                        'Polo clássica em piqué de algodão. Bordado discreto no peito e acabamento premium.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 98,
                    ratingAvg: '4.60',
                    ratingCount: 43,
                },

                {
                    name: 'Camiseta Henley Botões',
                    slug: 'camiseta-henley-botoes',
                    hasVariations: true,
                    description:
                        'Henley com botões emborrachados. Tecido waffle texturizado, perfeito para as estações mais frias.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 54,
                    ratingAvg: '4.30',
                    ratingCount: 22,
                },

                {
                    name: 'Camiseta Manga Longa Slim',
                    slug: 'camiseta-manga-longa-slim',
                    hasVariations: true,
                    description:
                        'Manga longa slim em malha fina. Perfeita para layering em dias mais frescos.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 134,
                    ratingAvg: '4.40',
                    ratingCount: 61,
                },

                {
                    name: 'Camiseta Graphic Urban',
                    slug: 'camiseta-graphic-urban',
                    hasVariations: true,
                    description:
                        'Camiseta com estampa gráfica exclusiva. Serigrafada à mão com tintas ecológicas.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 211,
                    ratingAvg: '4.55',
                    ratingCount: 78,
                },

                {
                    name: 'Camiseta Pack 3 Básicas',
                    slug: 'camiseta-pack-3-basicas',
                    hasVariations: false,
                    description:
                        'Kit com 3 camisetas básicas brancas tamanho M. Algodão penteado, ideal para o dia a dia.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 320,
                    ratingAvg: '4.80',
                    ratingCount: 102,
                    price: p(199.9),
                    compareAtPrice: p(249.9),
                    stock: 75,
                    skuCode: 'PACK3-M',
                },

                {
                    name: 'Camiseta Edição Limitada SS24',
                    slug: 'camiseta-ed-limitada-ss24',
                    hasVariations: false,
                    description:
                        'Edição limitada verão 2024 com estampa exclusiva de artista convidado. Colecionável.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 500,
                    ratingAvg: '4.90',
                    ratingCount: 213,
                    price: p(249.9),
                    compareAtPrice: null,
                    stock: 0,
                    skuCode: 'TS-EL-SS24',
                },

                {
                    name: 'Camiseta Muscle Fit',
                    slug: 'camiseta-muscle-fit',
                    hasVariations: true,
                    description:
                        'Muscle fit com decote amplo. Tecido stretch que acompanha cada movimento.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 87,
                    ratingAvg: '4.25',
                    ratingCount: 31,
                },

                {
                    name: 'Regata Feminina Canelada',
                    slug: 'regata-feminina-canelada',
                    hasVariations: false,
                    description:
                        'Regata canelada de alça fina. Tecido canelê com elastano, ajuste perfeito.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 390,
                    ratingAvg: '4.65',
                    ratingCount: 145,
                    price: p(59.9),
                    compareAtPrice: p(79.9),
                    stock: 50,
                    skuCode: 'RG-CAN-F',
                },

                {
                    name: 'Camiseta DryFit Performance',
                    slug: 'camiseta-dryfit-performance',
                    hasVariations: true,
                    description:
                        'DryFit técnico para treinos intensos. Absorção rápida de umidade e proteção UV 50+.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 266,
                    ratingAvg: '4.70',
                    ratingCount: 98,
                },

                {
                    name: 'Camiseta Tie-Dye Artesanal',
                    slug: 'camiseta-tie-dye-artesanal',
                    hasVariations: true,
                    description:
                        'Camiseta tingida à mão com técnica tie-dye. Cada peça é única.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 45,
                    ratingAvg: '4.85',
                    ratingCount: 19,
                },

                {
                    name: 'Camiseta Listrada Náutica',
                    slug: 'camiseta-listrada-nautica',
                    hasVariations: true,
                    description:
                        'Camiseta listrada estilo breton. Algodão premium com listras marinho e branco.',
                    categoryId: catMap['camisetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 112,
                    ratingAvg: '4.35',
                    ratingCount: 47,
                },

                {
                    name: 'Calça Cargo Utilitária',
                    slug: 'calca-cargo-utilitaria',
                    hasVariations: true,
                    description:
                        'Calça cargo com bolsos laterais funcionais. Tecido resistente com toque macio.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 156,
                    ratingAvg: '4.80',
                    ratingCount: 67,
                },

                {
                    name: 'Calça Slim Chino',
                    slug: 'calca-slim-chino',
                    hasVariations: true,
                    description:
                        'Calça chino slim com tecido premium. Versátil para ocasiões casuais e semi-formais.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 203,
                    ratingAvg: '4.40',
                    ratingCount: 91,
                },

                {
                    name: 'Calça Jogger Fleece',
                    slug: 'calca-jogger-fleece',
                    hasVariations: true,
                    description:
                        'Jogger em fleece com elástico na cintura e punhos. Conforto máximo para casa e treinos.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 178,
                    ratingAvg: '4.55',
                    ratingCount: 72,
                },

                {
                    name: 'Calça Jeans Slim',
                    slug: 'calca-jeans-slim',
                    hasVariations: true,
                    description:
                        'Jeans slim com lavagem stone. 2% elastano para maior mobilidade.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-denim'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 334,
                    ratingAvg: '4.65',
                    ratingCount: 127,
                },

                {
                    name: 'Calça Wide Leg Jeans',
                    slug: 'calca-wide-leg-jeans',
                    hasVariations: false,
                    description:
                        'Wide leg jeans com lavagem delavê. Taille alta e corte amplo, tendência da temporada.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-denim'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 89,
                    ratingAvg: '4.70',
                    ratingCount: 38,
                    price: p(229.9),
                    compareAtPrice: p(279.9),
                    stock: 0,
                    skuCode: 'JW-WL-38',
                },

                {
                    name: 'Calça Alfaiataria Slim',
                    slug: 'calca-alfaiataria-slim',
                    hasVariations: true,
                    description:
                        'Calça social slim em tecido bengaline. Ideal para o trabalho e eventos formais.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 67,
                    ratingAvg: '4.45',
                    ratingCount: 29,
                },

                {
                    name: 'Legging Feminina Supplex',
                    slug: 'legging-feminina-supplex',
                    hasVariations: false,
                    description:
                        'Legging em supplex com cós largo. Alta compressão e cintura ajustável.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 445,
                    ratingAvg: '4.85',
                    ratingCount: 189,
                    price: p(119.9),
                    compareAtPrice: p(149.9),
                    stock: 200,
                    skuCode: 'LG-SUPP-M',
                },

                {
                    name: 'Bermuda Cargo Masculina',
                    slug: 'bermuda-cargo-masculina',
                    hasVariations: true,
                    description:
                        'Bermuda cargo com 6 bolsos. Sarja resistente ideal para o verão.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 222,
                    ratingAvg: '4.50',
                    ratingCount: 84,
                },

                {
                    name: 'Calça Moletom Oversized',
                    slug: 'calca-moletom-oversized',
                    hasVariations: true,
                    description:
                        'Moletom oversized com bolso canguru na frente. Fleece extra macio.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 58,
                    ratingAvg: '4.60',
                    ratingCount: 23,
                },

                {
                    name: 'Calça Ciclista Feminina',
                    slug: 'calca-ciclista-feminina',
                    hasVariations: false,
                    description:
                        'Ciclista em couro sintético vegano. Ultra versátil, do treino ao look urbano.',
                    categoryId: catMap['calcas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 176,
                    ratingAvg: '4.75',
                    ratingCount: 61,
                    price: p(99.9),
                    compareAtPrice: null,
                    stock: 40,
                    skuCode: 'CC-F-M',
                },

                {
                    name: 'Tênis Runner Pro',
                    slug: 'tenis-runner-pro',
                    hasVariations: true,
                    description:
                        'Tênis running com amortecimento responsivo e solado de borracha de alta durabilidade.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 312,
                    ratingAvg: '4.90',
                    ratingCount: 142,
                },

                {
                    name: 'Tênis Casual Urbano',
                    slug: 'tenis-casual-urbano',
                    hasVariations: true,
                    description:
                        'Tênis casual com design urbano minimalista. Cabedal em couro sintético premium.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 189,
                    ratingAvg: '4.60',
                    ratingCount: 73,
                },

                {
                    name: 'Chinelo Slide Borracha',
                    slug: 'chinelo-slide-borracha',
                    hasVariations: false,
                    description:
                        'Slide em borracha injetada com solado antiderrapante. Conforto para casa e praia.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 530,
                    ratingAvg: '4.30',
                    ratingCount: 231,
                    price: p(69.9),
                    compareAtPrice: p(89.9),
                    stock: 300,
                    skuCode: 'SL-BOR-42',
                },

                {
                    name: 'Bota Couro Cano Curto',
                    slug: 'bota-couro-cano-curto',
                    hasVariations: true,
                    description:
                        'Bota masculina em couro legítimo. Solado de borracha e palmilha anatômica.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-premium'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 77,
                    ratingAvg: '4.75',
                    ratingCount: 34,
                },

                {
                    name: 'Sapatênis Couro Premium',
                    slug: 'sapatenis-couro-premium',
                    hasVariations: false,
                    description:
                        'Sapatênis em couro premium com solado crepe. Elegante e confortável.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-premium'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 43,
                    ratingAvg: '4.80',
                    ratingCount: 21,
                    price: p(349.9),
                    compareAtPrice: null,
                    stock: 0,
                    skuCode: 'ST-CRP-41',
                },

                {
                    name: 'Tênis Plataforma Feminino',
                    slug: 'tenis-plataforma-feminino',
                    hasVariations: true,
                    description:
                        'Tênis chunky com plataforma de 5 cm. Solado em borracha dentada.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-footwear'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 134,
                    ratingAvg: '4.55',
                    ratingCount: 49,
                },

                {
                    name: 'Sandália Rasteira Tiras',
                    slug: 'sandalia-rasteira-tiras',
                    hasVariations: true,
                    description:
                        'Sandália rasteira com tiras reguláveis. Solado anatômico em EVA.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-footwear'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 88,
                    ratingAvg: '4.40',
                    ratingCount: 36,
                },

                {
                    name: 'Tênis High Top Lona',
                    slug: 'tenis-high-top-lona',
                    hasVariations: true,
                    description:
                        'High top em lona com cadarço de couro. Clássico reinventado com detalhes modernos.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 102,
                    ratingAvg: '4.50',
                    ratingCount: 41,
                },

                {
                    name: 'Loafer Mocassim Couro',
                    slug: 'loafer-mocassim-couro',
                    hasVariations: false,
                    description:
                        'Mocassim em couro italiano. Acabamento artesanal com moccasin stitch tradicional.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 61,
                    ratingAvg: '4.70',
                    ratingCount: 27,
                    price: p(419.9),
                    compareAtPrice: p(499.9),
                    stock: 15,
                    skuCode: 'LF-MOC-41',
                },

                {
                    name: 'Tênis Trail Outdoor',
                    slug: 'tenis-trail-outdoor',
                    hasVariations: true,
                    description:
                        'Tênis trail com solado de borracha vibram. Impermeável e ultra resistente para trilhas.',
                    categoryId: catMap['calcados'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 29,
                    ratingAvg: '4.85',
                    ratingCount: 16,
                },

                {
                    name: 'Jaqueta Bomber Premium',
                    slug: 'jaqueta-bomber-premium',
                    hasVariations: true,
                    description:
                        'Jaqueta bomber com forro de qualidade. Design atemporal que combina com qualquer look.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 98,
                    ratingAvg: '4.85',
                    ratingCount: 44,
                },

                {
                    name: 'Jaqueta Corta-Vento',
                    slug: 'jaqueta-corta-vento',
                    hasVariations: true,
                    description:
                        'Jaqueta corta-vento leve e impermeável. Ideal para atividades ao ar livre.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 67,
                    ratingAvg: '4.30',
                    ratingCount: 28,
                },

                {
                    name: 'Jaqueta Jeans Oversized',
                    slug: 'jaqueta-jeans-oversized',
                    hasVariations: true,
                    description:
                        'Jaqueta jeans lavagem destroyed. Corte oversized com bordados no ombro.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-denim'],
                    gender: 'women',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 55,
                    ratingAvg: '4.60',
                    ratingCount: 23,
                },

                {
                    name: 'Jaqueta Couro Biker',
                    slug: 'jaqueta-couro-biker',
                    hasVariations: true,
                    description:
                        'Jaqueta biker em couro sintético premium. Zíperes metálicos e forro de poliéster.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 42,
                    ratingAvg: '4.75',
                    ratingCount: 19,
                },

                {
                    name: 'Colete Puffer Sem Manga',
                    slug: 'colete-puffer-sem-manga',
                    hasVariations: false,
                    description:
                        'Colete puffer com enchimento de fibra de poliéster reciclada. Ultra leve e compactável.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-sport'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 34,
                    ratingAvg: '4.40',
                    ratingCount: 14,
                    price: p(239.9),
                    compareAtPrice: p(289.9),
                    stock: 0,
                    skuCode: 'VT-PUF-M',
                },

                {
                    name: 'Jaqueta Moletom Canguru',
                    slug: 'jaqueta-moletom-canguru',
                    hasVariations: true,
                    description:
                        'Moletom full zip com bolso canguru. Fleece interno com toque aveludado.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 148,
                    ratingAvg: '4.55',
                    ratingCount: 62,
                },

                {
                    name: 'Jaqueta Sherpa Forrada',
                    slug: 'jaqueta-sherpa-forrada',
                    hasVariations: true,
                    description:
                        'Jaqueta jeans com forro sherpa. Quente e estilosa para o inverno.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-denim'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 39,
                    ratingAvg: '4.65',
                    ratingCount: 17,
                },

                {
                    name: 'Blazer Linho Casual',
                    slug: 'blazer-linho-casual',
                    hasVariations: false,
                    description:
                        'Blazer em linho natural. Estrutura levemente soft, ideal para looks smart casual.',
                    categoryId: catMap['jaquetas'],
                    brandId: brandMap['nero-premium'],
                    gender: 'men',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 28,
                    ratingAvg: '4.80',
                    ratingCount: 12,
                    price: p(499.9),
                    compareAtPrice: p(599.9),
                    stock: 8,
                    skuCode: 'BL-LNH-M',
                },

                {
                    name: 'Boné Dad Hat',
                    slug: 'bone-dad-hat',
                    hasVariations: false,
                    description:
                        'Boné dad hat com bordado delicado. Regulagem ajustável para todos os tamanhos.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 321,
                    ratingAvg: '4.50',
                    ratingCount: 115,
                    price: p(89.9),
                    compareAtPrice: p(109.9),
                    stock: 120,
                    skuCode: 'BN-DAD-UNI',
                },

                {
                    name: 'Boné Snapback Aba Reta',
                    slug: 'bone-snapback-aba-reta',
                    hasVariations: true,
                    description:
                        'Snapback com aba reta e fechamento ajustável. Bordado 3D na frente.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 187,
                    ratingAvg: '4.35',
                    ratingCount: 73,
                },

                {
                    name: 'Mochila Urban 20L',
                    slug: 'mochila-urban-20l',
                    hasVariations: false,
                    description:
                        'Mochila urbana com compartimento para notebook 15". Tecido resistente à água.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: true,
                    soldCount: 142,
                    ratingAvg: '4.70',
                    ratingCount: 58,
                    price: p(199.9),
                    compareAtPrice: p(249.9),
                    stock: 35,
                    skuCode: 'MCH-URB-20',
                },

                {
                    name: 'Kit Meias Cano Médio (5 pares)',
                    slug: 'kit-meias-cano-medio-5',
                    hasVariations: false,
                    description:
                        'Kit com 5 pares de meias em algodão penteado. Reforo no calcanhar e biqueira.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 634,
                    ratingAvg: '4.60',
                    ratingCount: 211,
                    price: p(79.9),
                    compareAtPrice: null,
                    stock: 400,
                    skuCode: 'MIA-KIT5-UNI',
                },

                {
                    name: 'Carteira Slim Couro',
                    slug: 'carteira-slim-couro',
                    hasVariations: false,
                    description:
                        'Carteira slim em couro legítimo com porta-cartões e bolso para notas.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 89,
                    ratingAvg: '4.75',
                    ratingCount: 37,
                    price: p(149.9),
                    compareAtPrice: p(179.9),
                    stock: 0,
                    skuCode: 'CRT-SLM-UNI',
                },

                {
                    name: 'Óculos de Sol Polarizado',
                    slug: 'oculos-sol-polarizado',
                    hasVariations: true,
                    description:
                        'Armação acetato com lentes polarizadas UV400. Proteção total e estilo minimalista.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 75,
                    ratingAvg: '4.65',
                    ratingCount: 29,
                },

                {
                    name: 'Cinto Couro Trançado',
                    slug: 'cinto-couro-trancado',
                    hasVariations: false,
                    description:
                        'Cinto trançado em couro legítimo. Fivela em metal inoxidável.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 53,
                    ratingAvg: '4.55',
                    ratingCount: 21,
                    price: p(129.9),
                    compareAtPrice: null,
                    stock: 25,
                    skuCode: 'CIN-TRC-M',
                },

                {
                    name: 'Nécessaire Premium Couro',
                    slug: 'necessaire-premium-couro',
                    hasVariations: false,
                    description:
                        'Nécessaire em couro sintético com compartimentos organizadores. Fecho zíper YKK.',
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-premium'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 27,
                    ratingAvg: '4.70',
                    ratingCount: 11,
                    price: p(119.9),
                    compareAtPrice: p(149.9),
                    stock: 0,
                    skuCode: 'NCS-PRM-UNI',
                },
            ])
            .returning();

        // Mapear por slug para facilitar referências
        const pm = Object.fromEntries(insertedProducts.map((p) => [p.slug, p]));
        console.log(`✅ ${insertedProducts.length} produtos inseridos.\n`);

        console.log('🎨 Inserindo variações e SKUs...');
        let totalSkus = 0;

        const ovsSKUs = await createProductWithVariations(
            pm['camiseta-oversized-cotton'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Branco', imageUrl: IMG.color_white },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: 'P' },
                        { value: 'M' },
                        { value: 'G' },
                        { value: 'GG' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 129.9,
                    stock: 52,
                    skuCode: 'TS-OVS-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 129.9,
                    stock: 78,
                    skuCode: 'TS-OVS-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 129.9,
                    stock: 63,
                    skuCode: 'TS-OVS-G-BLK',
                },
                {
                    optionValues: ['Preto', 'GG'],
                    price: 139.9,
                    stock: 30,
                    skuCode: 'TS-OVS-GG-BLK',
                },
                {
                    optionValues: ['Branco', 'P'],
                    price: 129.9,
                    stock: 45,
                    skuCode: 'TS-OVS-P-WHT',
                },
                {
                    optionValues: ['Branco', 'M'],
                    price: 129.9,
                    stock: 60,
                    skuCode: 'TS-OVS-M-WHT',
                },
                {
                    optionValues: ['Branco', 'G'],
                    price: 129.9,
                    stock: 0,
                    skuCode: 'TS-OVS-G-WHT',
                },
                {
                    optionValues: ['Cinza', 'M'],
                    price: 129.9,
                    stock: 40,
                    skuCode: 'TS-OVS-M-GRY',
                },
                {
                    optionValues: ['Cinza', 'G'],
                    price: 129.9,
                    stock: 35,
                    skuCode: 'TS-OVS-G-GRY',
                },
            ],
        );
        totalSkus += ovsSKUs.length;

        const bscSKUs = await createProductWithVariations(
            pm['camiseta-basic-slim'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: 'P' },
                        { value: 'M' },
                        { value: 'G' },
                        { value: 'GG' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 89.9,
                    stock: 80,
                    skuCode: 'TS-BSC-P',
                },
                {
                    optionValues: ['M'],
                    price: 89.9,
                    stock: 95,
                    skuCode: 'TS-BSC-M',
                },
                {
                    optionValues: ['G'],
                    price: 89.9,
                    stock: 70,
                    skuCode: 'TS-BSC-G',
                },
                {
                    optionValues: ['GG'],
                    price: 99.9,
                    stock: 40,
                    skuCode: 'TS-BSC-GG',
                },
            ],
        );
        totalSkus += bscSKUs.length;

        await createProductWithVariations(
            pm['camiseta-cropped-feminina'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'PP' }, { value: 'P' }, { value: 'M' }],
                },
            ],
            [
                {
                    optionValues: ['PP'],
                    price: 79.9,
                    stock: 35,
                    skuCode: 'TS-CRP-PP',
                },
                {
                    optionValues: ['P'],
                    price: 79.9,
                    stock: 50,
                    skuCode: 'TS-CRP-P',
                },
                {
                    optionValues: ['M'],
                    price: 79.9,
                    stock: 0,
                    skuCode: 'TS-CRP-M',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['polo-pique-premium'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Azul Marinho', imageUrl: IMG.color_navy },
                        { value: 'Branco', imageUrl: IMG.color_white },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Azul Marinho', 'P'],
                    price: 149.9,
                    stock: 20,
                    skuCode: 'PL-PQ-P-NVY',
                },
                {
                    optionValues: ['Azul Marinho', 'M'],
                    price: 149.9,
                    stock: 30,
                    skuCode: 'PL-PQ-M-NVY',
                },
                {
                    optionValues: ['Azul Marinho', 'G'],
                    price: 149.9,
                    stock: 15,
                    skuCode: 'PL-PQ-G-NVY',
                },
                {
                    optionValues: ['Branco', 'P'],
                    price: 149.9,
                    stock: 18,
                    skuCode: 'PL-PQ-P-WHT',
                },
                {
                    optionValues: ['Branco', 'M'],
                    price: 149.9,
                    stock: 25,
                    skuCode: 'PL-PQ-M-WHT',
                },
                {
                    optionValues: ['Branco', 'G'],
                    price: 149.9,
                    stock: 0,
                    skuCode: 'PL-PQ-G-WHT',
                },
            ],
        );
        totalSkus += 6;

        await createProductWithVariations(
            pm['camiseta-henley-botoes'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 99.9,
                    stock: 0,
                    skuCode: 'TS-HNL-P',
                },
                {
                    optionValues: ['M'],
                    price: 99.9,
                    stock: 0,
                    skuCode: 'TS-HNL-M',
                },
                {
                    optionValues: ['G'],
                    price: 99.9,
                    stock: 0,
                    skuCode: 'TS-HNL-G',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['camiseta-manga-longa-slim'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 109.9,
                    stock: 30,
                    skuCode: 'ML-SLM-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 109.9,
                    stock: 40,
                    skuCode: 'ML-SLM-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 109.9,
                    stock: 22,
                    skuCode: 'ML-SLM-G-BLK',
                },
                {
                    optionValues: ['Cinza', 'M'],
                    price: 109.9,
                    stock: 35,
                    skuCode: 'ML-SLM-M-GRY',
                },
                {
                    optionValues: ['Cinza', 'G'],
                    price: 109.9,
                    stock: 18,
                    skuCode: 'ML-SLM-G-GRY',
                },
            ],
        );
        totalSkus += 5;

        await createProductWithVariations(
            pm['camiseta-graphic-urban'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: 'P' },
                        { value: 'M' },
                        { value: 'G' },
                        { value: 'GG' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 119.9,
                    stock: 25,
                    skuCode: 'TS-GRP-P',
                },
                {
                    optionValues: ['M'],
                    price: 119.9,
                    stock: 38,
                    skuCode: 'TS-GRP-M',
                },
                {
                    optionValues: ['G'],
                    price: 119.9,
                    stock: 30,
                    skuCode: 'TS-GRP-G',
                },
                {
                    optionValues: ['GG'],
                    price: 129.9,
                    stock: 12,
                    skuCode: 'TS-GRP-GG',
                },
            ],
        );
        totalSkus += 4;

        await createProductWithVariations(
            pm['camiseta-muscle-fit'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 89.9,
                    stock: 20,
                    skuCode: 'TS-MSC-P',
                },
                {
                    optionValues: ['M'],
                    price: 89.9,
                    stock: 30,
                    skuCode: 'TS-MSC-M',
                },
                {
                    optionValues: ['G'],
                    price: 89.9,
                    stock: 15,
                    skuCode: 'TS-MSC-G',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['camiseta-dryfit-performance'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Verde', imageUrl: IMG.color_green },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: 'P' },
                        { value: 'M' },
                        { value: 'G' },
                        { value: 'GG' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 119.9,
                    stock: 30,
                    skuCode: 'DF-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 119.9,
                    stock: 45,
                    skuCode: 'DF-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 119.9,
                    stock: 28,
                    skuCode: 'DF-G-BLK',
                },
                {
                    optionValues: ['Preto', 'GG'],
                    price: 129.9,
                    stock: 12,
                    skuCode: 'DF-GG-BLK',
                },
                {
                    optionValues: ['Verde', 'P'],
                    price: 119.9,
                    stock: 20,
                    skuCode: 'DF-P-GRN',
                },
                {
                    optionValues: ['Verde', 'M'],
                    price: 119.9,
                    stock: 32,
                    skuCode: 'DF-M-GRN',
                },
                {
                    optionValues: ['Verde', 'G'],
                    price: 119.9,
                    stock: 18,
                    skuCode: 'DF-G-GRN',
                },
            ],
        );
        totalSkus += 7;

        await createProductWithVariations(
            pm['camiseta-tie-dye-artesanal'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 139.9,
                    stock: 0,
                    skuCode: 'TD-P',
                },
                {
                    optionValues: ['M'],
                    price: 139.9,
                    stock: 0,
                    skuCode: 'TD-M',
                },
                {
                    optionValues: ['G'],
                    price: 139.9,
                    stock: 0,
                    skuCode: 'TD-G',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['camiseta-listrada-nautica'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 109.9,
                    stock: 22,
                    skuCode: 'TS-LST-P',
                },
                {
                    optionValues: ['M'],
                    price: 109.9,
                    stock: 35,
                    skuCode: 'TS-LST-M',
                },
                {
                    optionValues: ['G'],
                    price: 109.9,
                    stock: 18,
                    skuCode: 'TS-LST-G',
                },
            ],
        );
        totalSkus += 3;

        const cargoSKUs = await createProductWithVariations(
            pm['calca-cargo-utilitaria'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '40' },
                        { value: '42' },
                        { value: '44' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['38'],
                    price: 249.9,
                    stock: 25,
                    skuCode: 'CC-UTIL-38',
                },
                {
                    optionValues: ['40'],
                    price: 249.9,
                    stock: 34,
                    skuCode: 'CC-UTIL-40',
                },
                {
                    optionValues: ['42'],
                    price: 249.9,
                    stock: 41,
                    skuCode: 'CC-UTIL-42',
                },
                {
                    optionValues: ['44'],
                    price: 249.9,
                    stock: 18,
                    skuCode: 'CC-UTIL-44',
                },
            ],
        );
        totalSkus += cargoSKUs.length;

        await createProductWithVariations(
            pm['calca-slim-chino'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '40' },
                        { value: '42' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['38'],
                    price: 199.9,
                    stock: 30,
                    skuCode: 'CH-SLM-38',
                },
                {
                    optionValues: ['40'],
                    price: 199.9,
                    stock: 45,
                    skuCode: 'CH-SLM-40',
                },
                {
                    optionValues: ['42'],
                    price: 199.9,
                    stock: 38,
                    skuCode: 'CH-SLM-42',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['calca-jogger-fleece'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 149.9,
                    stock: 20,
                    skuCode: 'JGG-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 149.9,
                    stock: 30,
                    skuCode: 'JGG-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 149.9,
                    stock: 18,
                    skuCode: 'JGG-G-BLK',
                },
                {
                    optionValues: ['Cinza', 'M'],
                    price: 149.9,
                    stock: 25,
                    skuCode: 'JGG-M-GRY',
                },
                {
                    optionValues: ['Cinza', 'G'],
                    price: 149.9,
                    stock: 14,
                    skuCode: 'JGG-G-GRY',
                },
            ],
        );
        totalSkus += 5;

        await createProductWithVariations(
            pm['calca-jeans-slim'].id,
            [
                {
                    name: 'Lavagem',
                    hasImage: true,
                    options: [
                        { value: 'Stone', imageUrl: IMG.color_grey },
                        { value: 'Escuro', imageUrl: IMG.color_navy },
                        { value: 'Claro', imageUrl: IMG.color_white },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '40' },
                        { value: '42' },
                        { value: '44' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Stone', '38'],
                    price: 219.9,
                    stock: 20,
                    skuCode: 'JN-SL-38-ST',
                },
                {
                    optionValues: ['Stone', '40'],
                    price: 219.9,
                    stock: 28,
                    skuCode: 'JN-SL-40-ST',
                },
                {
                    optionValues: ['Stone', '42'],
                    price: 219.9,
                    stock: 15,
                    skuCode: 'JN-SL-42-ST',
                },
                {
                    optionValues: ['Escuro', '38'],
                    price: 219.9,
                    stock: 18,
                    skuCode: 'JN-SL-38-DK',
                },
                {
                    optionValues: ['Escuro', '40'],
                    price: 219.9,
                    stock: 24,
                    skuCode: 'JN-SL-40-DK',
                },
                {
                    optionValues: ['Claro', '40'],
                    price: 219.9,
                    stock: 0,
                    skuCode: 'JN-SL-40-LT',
                },
                {
                    optionValues: ['Claro', '42'],
                    price: 219.9,
                    stock: 0,
                    skuCode: 'JN-SL-42-LT',
                },
            ],
        );
        totalSkus += 7;

        await createProductWithVariations(
            pm['calca-alfaiataria-slim'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '40' },
                        { value: '42' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['38'],
                    price: 279.9,
                    stock: 12,
                    skuCode: 'ALF-38',
                },
                {
                    optionValues: ['40'],
                    price: 279.9,
                    stock: 18,
                    skuCode: 'ALF-40',
                },
                {
                    optionValues: ['42'],
                    price: 279.9,
                    stock: 9,
                    skuCode: 'ALF-42',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['bermuda-cargo-masculina'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '40' },
                        { value: '42' },
                        { value: '44' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['38'],
                    price: 169.9,
                    stock: 30,
                    skuCode: 'BRM-38',
                },
                {
                    optionValues: ['40'],
                    price: 169.9,
                    stock: 40,
                    skuCode: 'BRM-40',
                },
                {
                    optionValues: ['42'],
                    price: 169.9,
                    stock: 28,
                    skuCode: 'BRM-42',
                },
                {
                    optionValues: ['44'],
                    price: 169.9,
                    stock: 15,
                    skuCode: 'BRM-44',
                },
            ],
        );
        totalSkus += 4;

        await createProductWithVariations(
            pm['calca-moletom-oversized'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 159.9,
                    stock: 0,
                    skuCode: 'MLT-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 159.9,
                    stock: 0,
                    skuCode: 'MLT-M-BLK',
                },
                {
                    optionValues: ['Cinza', 'G'],
                    price: 159.9,
                    stock: 0,
                    skuCode: 'MLT-G-GRY',
                },
            ],
        );
        totalSkus += 3;

        const runnerSKUs = await createProductWithVariations(
            pm['tenis-runner-pro'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '39' },
                        { value: '40' },
                        { value: '41' },
                        { value: '42' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['38'],
                    price: 399.9,
                    stock: 20,
                    skuCode: 'TN-RUN-38',
                },
                {
                    optionValues: ['39'],
                    price: 399.9,
                    stock: 28,
                    skuCode: 'TN-RUN-39',
                },
                {
                    optionValues: ['40'],
                    price: 399.9,
                    stock: 32,
                    skuCode: 'TN-RUN-40',
                },
                {
                    optionValues: ['41'],
                    price: 399.9,
                    stock: 27,
                    skuCode: 'TN-RUN-41',
                },
                {
                    optionValues: ['42'],
                    price: 399.9,
                    stock: 22,
                    skuCode: 'TN-RUN-42',
                },
            ],
        );
        totalSkus += runnerSKUs.length;

        await createProductWithVariations(
            pm['tenis-casual-urbano'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '39' },
                        { value: '40' },
                        { value: '41' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['39'],
                    price: 289.9,
                    stock: 15,
                    skuCode: 'TN-CSL-39',
                },
                {
                    optionValues: ['40'],
                    price: 289.9,
                    stock: 22,
                    skuCode: 'TN-CSL-40',
                },
                {
                    optionValues: ['41'],
                    price: 289.9,
                    stock: 18,
                    skuCode: 'TN-CSL-41',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['bota-couro-cano-curto'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Marrom', imageUrl: IMG.color_brown },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '40' },
                        { value: '41' },
                        { value: '42' },
                        { value: '43' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', '40'],
                    price: 429.9,
                    stock: 8,
                    skuCode: 'BT-40-BLK',
                },
                {
                    optionValues: ['Preto', '41'],
                    price: 429.9,
                    stock: 10,
                    skuCode: 'BT-41-BLK',
                },
                {
                    optionValues: ['Preto', '42'],
                    price: 429.9,
                    stock: 7,
                    skuCode: 'BT-42-BLK',
                },
                {
                    optionValues: ['Preto', '43'],
                    price: 429.9,
                    stock: 4,
                    skuCode: 'BT-43-BLK',
                },
                {
                    optionValues: ['Marrom', '40'],
                    price: 429.9,
                    stock: 6,
                    skuCode: 'BT-40-BRN',
                },
                {
                    optionValues: ['Marrom', '41'],
                    price: 429.9,
                    stock: 9,
                    skuCode: 'BT-41-BRN',
                },
                {
                    optionValues: ['Marrom', '42'],
                    price: 429.9,
                    stock: 0,
                    skuCode: 'BT-42-BRN',
                },
            ],
        );
        totalSkus += 7;

        await createProductWithVariations(
            pm['tenis-plataforma-feminino'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Branco', imageUrl: IMG.color_white },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '36' },
                        { value: '37' },
                        { value: '38' },
                        { value: '39' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', '36'],
                    price: 279.9,
                    stock: 12,
                    skuCode: 'PLT-36-BLK',
                },
                {
                    optionValues: ['Preto', '37'],
                    price: 279.9,
                    stock: 15,
                    skuCode: 'PLT-37-BLK',
                },
                {
                    optionValues: ['Preto', '38'],
                    price: 279.9,
                    stock: 10,
                    skuCode: 'PLT-38-BLK',
                },
                {
                    optionValues: ['Branco', '37'],
                    price: 279.9,
                    stock: 8,
                    skuCode: 'PLT-37-WHT',
                },
                {
                    optionValues: ['Branco', '38'],
                    price: 279.9,
                    stock: 11,
                    skuCode: 'PLT-38-WHT',
                },
                {
                    optionValues: ['Branco', '39'],
                    price: 279.9,
                    stock: 0,
                    skuCode: 'PLT-39-WHT',
                },
            ],
        );
        totalSkus += 6;

        await createProductWithVariations(
            pm['sandalia-rasteira-tiras'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Nude', imageUrl: IMG.color_brown },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '35' },
                        { value: '36' },
                        { value: '37' },
                        { value: '38' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', '35'],
                    price: 129.9,
                    stock: 12,
                    skuCode: 'SD-35-BLK',
                },
                {
                    optionValues: ['Preto', '36'],
                    price: 129.9,
                    stock: 15,
                    skuCode: 'SD-36-BLK',
                },
                {
                    optionValues: ['Preto', '37'],
                    price: 129.9,
                    stock: 10,
                    skuCode: 'SD-37-BLK',
                },
                {
                    optionValues: ['Nude', '36'],
                    price: 129.9,
                    stock: 8,
                    skuCode: 'SD-36-NUD',
                },
                {
                    optionValues: ['Nude', '37'],
                    price: 129.9,
                    stock: 12,
                    skuCode: 'SD-37-NUD',
                },
                {
                    optionValues: ['Nude', '38'],
                    price: 129.9,
                    stock: 7,
                    skuCode: 'SD-38-NUD',
                },
            ],
        );
        totalSkus += 6;

        await createProductWithVariations(
            pm['tenis-high-top-lona'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Branco', imageUrl: IMG.color_white },
                        { value: 'Azul', imageUrl: IMG.color_blue },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '38' },
                        { value: '39' },
                        { value: '40' },
                        { value: '41' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', '38'],
                    price: 199.9,
                    stock: 10,
                    skuCode: 'HT-38-BLK',
                },
                {
                    optionValues: ['Preto', '39'],
                    price: 199.9,
                    stock: 14,
                    skuCode: 'HT-39-BLK',
                },
                {
                    optionValues: ['Preto', '40'],
                    price: 199.9,
                    stock: 12,
                    skuCode: 'HT-40-BLK',
                },
                {
                    optionValues: ['Branco', '39'],
                    price: 199.9,
                    stock: 9,
                    skuCode: 'HT-39-WHT',
                },
                {
                    optionValues: ['Branco', '40'],
                    price: 199.9,
                    stock: 11,
                    skuCode: 'HT-40-WHT',
                },
                {
                    optionValues: ['Azul', '40'],
                    price: 199.9,
                    stock: 7,
                    skuCode: 'HT-40-BLU',
                },
                {
                    optionValues: ['Azul', '41'],
                    price: 199.9,
                    stock: 0,
                    skuCode: 'HT-41-BLU',
                },
            ],
        );
        totalSkus += 7;

        await createProductWithVariations(
            pm['tenis-trail-outdoor'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: '39' },
                        { value: '40' },
                        { value: '41' },
                        { value: '42' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['39'],
                    price: 449.9,
                    stock: 0,
                    skuCode: 'TRL-39',
                },
                {
                    optionValues: ['40'],
                    price: 449.9,
                    stock: 0,
                    skuCode: 'TRL-40',
                },
                {
                    optionValues: ['41'],
                    price: 449.9,
                    stock: 0,
                    skuCode: 'TRL-41',
                },
                {
                    optionValues: ['42'],
                    price: 449.9,
                    stock: 0,
                    skuCode: 'TRL-42',
                },
            ],
        );
        totalSkus += 4;

        const bomberSKUs = await createProductWithVariations(
            pm['jaqueta-bomber-premium'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 459.9,
                    stock: 15,
                    skuCode: 'JK-BMB-P',
                },
                {
                    optionValues: ['M'],
                    price: 459.9,
                    stock: 20,
                    skuCode: 'JK-BMB-M',
                },
                {
                    optionValues: ['G'],
                    price: 459.9,
                    stock: 12,
                    skuCode: 'JK-BMB-G',
                },
            ],
        );
        totalSkus += bomberSKUs.length;

        await createProductWithVariations(
            pm['jaqueta-corta-vento'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Azul', imageUrl: IMG.color_blue },
                        { value: 'Preto', imageUrl: IMG.color_black },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Azul', 'P'],
                    price: 319.9,
                    stock: 8,
                    skuCode: 'JK-CTV-P-BLU',
                },
                {
                    optionValues: ['Azul', 'M'],
                    price: 319.9,
                    stock: 12,
                    skuCode: 'JK-CTV-M-BLU',
                },
                {
                    optionValues: ['Azul', 'G'],
                    price: 319.9,
                    stock: 6,
                    skuCode: 'JK-CTV-G-BLU',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 319.9,
                    stock: 10,
                    skuCode: 'JK-CTV-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 319.9,
                    stock: 8,
                    skuCode: 'JK-CTV-G-BLK',
                },
            ],
        );
        totalSkus += 5;

        await createProductWithVariations(
            pm['jaqueta-jeans-oversized'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 299.9,
                    stock: 10,
                    skuCode: 'JK-JNS-P',
                },
                {
                    optionValues: ['M'],
                    price: 299.9,
                    stock: 14,
                    skuCode: 'JK-JNS-M',
                },
                {
                    optionValues: ['G'],
                    price: 299.9,
                    stock: 8,
                    skuCode: 'JK-JNS-G',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['jaqueta-couro-biker'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Marrom', imageUrl: IMG.color_brown },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 529.9,
                    stock: 5,
                    skuCode: 'BK-P-BLK',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 529.9,
                    stock: 8,
                    skuCode: 'BK-M-BLK',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 529.9,
                    stock: 4,
                    skuCode: 'BK-G-BLK',
                },
                {
                    optionValues: ['Marrom', 'M'],
                    price: 529.9,
                    stock: 6,
                    skuCode: 'BK-M-BRN',
                },
                {
                    optionValues: ['Marrom', 'G'],
                    price: 529.9,
                    stock: 0,
                    skuCode: 'BK-G-BRN',
                },
            ],
        );
        totalSkus += 5;

        await createProductWithVariations(
            pm['jaqueta-moletom-canguru'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                    ],
                },
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [
                        { value: 'P' },
                        { value: 'M' },
                        { value: 'G' },
                        { value: 'GG' },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto', 'P'],
                    price: 229.9,
                    stock: 18,
                    skuCode: 'MLT-P-BLK-J',
                },
                {
                    optionValues: ['Preto', 'M'],
                    price: 229.9,
                    stock: 25,
                    skuCode: 'MLT-M-BLK-J',
                },
                {
                    optionValues: ['Preto', 'G'],
                    price: 229.9,
                    stock: 20,
                    skuCode: 'MLT-G-BLK-J',
                },
                {
                    optionValues: ['Preto', 'GG'],
                    price: 239.9,
                    stock: 10,
                    skuCode: 'MLT-GG-BLK-J',
                },
                {
                    optionValues: ['Cinza', 'M'],
                    price: 229.9,
                    stock: 22,
                    skuCode: 'MLT-M-GRY-J',
                },
                {
                    optionValues: ['Cinza', 'G'],
                    price: 229.9,
                    stock: 15,
                    skuCode: 'MLT-G-GRY-J',
                },
            ],
        );
        totalSkus += 6;

        await createProductWithVariations(
            pm['jaqueta-sherpa-forrada'].id,
            [
                {
                    name: 'Tamanho',
                    hasImage: false,
                    options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }],
                },
            ],
            [
                {
                    optionValues: ['P'],
                    price: 349.9,
                    stock: 7,
                    skuCode: 'SHP-P',
                },
                {
                    optionValues: ['M'],
                    price: 349.9,
                    stock: 10,
                    skuCode: 'SHP-M',
                },
                {
                    optionValues: ['G'],
                    price: 349.9,
                    stock: 5,
                    skuCode: 'SHP-G',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['bone-snapback-aba-reta'].id,
            [
                {
                    name: 'Cor',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Cinza', imageUrl: IMG.color_grey },
                        { value: 'Azul', imageUrl: IMG.color_blue },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto'],
                    price: 99.9,
                    stock: 45,
                    skuCode: 'SB-BLK',
                },
                {
                    optionValues: ['Cinza'],
                    price: 99.9,
                    stock: 30,
                    skuCode: 'SB-GRY',
                },
                {
                    optionValues: ['Azul'],
                    price: 99.9,
                    stock: 0,
                    skuCode: 'SB-BLU',
                },
            ],
        );
        totalSkus += 3;

        await createProductWithVariations(
            pm['oculos-sol-polarizado'].id,
            [
                {
                    name: 'Armação',
                    hasImage: true,
                    options: [
                        { value: 'Preto', imageUrl: IMG.color_black },
                        { value: 'Tartaruga', imageUrl: IMG.color_brown },
                    ],
                },
            ],
            [
                {
                    optionValues: ['Preto'],
                    price: 189.9,
                    stock: 20,
                    skuCode: 'OC-BLK',
                },
                {
                    optionValues: ['Tartaruga'],
                    price: 189.9,
                    stock: 15,
                    skuCode: 'OC-TRT',
                },
            ],
        );
        totalSkus += 2;

        console.log(`✅ ${totalSkus} SKUs inseridos.\n`);

        console.log('🖼️  Inserindo imagens...');
        await db.insert(productImages).values([
            {
                productId: pm['camiseta-oversized-cotton'].id,
                url: IMG.tshirt_black,
                altText: 'Camiseta oversized preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-oversized-cotton'].id,
                url: IMG.tshirt_white,
                altText: 'Camiseta oversized branca',
                position: 2,
                isPrimary: false,
            },
            {
                productId: pm['camiseta-oversized-cotton'].id,
                url: IMG.tshirt_grey,
                altText: 'Camiseta oversized cinza',
                position: 3,
                isPrimary: false,
            },
            {
                productId: pm['camiseta-basic-slim'].id,
                url: IMG.tshirt_grey,
                altText: 'Camiseta basic slim cinza',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-cropped-feminina'].id,
                url: IMG.tshirt_crop,
                altText: 'Camiseta cropped feminina',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['polo-pique-premium'].id,
                url: IMG.tshirt_polo,
                altText: 'Polo piqué marinho',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-henley-botoes'].id,
                url: IMG.tshirt_henley,
                altText: 'Camiseta henley botões',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-manga-longa-slim'].id,
                url: IMG.tshirt_long,
                altText: 'Camiseta manga longa preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-graphic-urban'].id,
                url: IMG.tshirt_graphic,
                altText: 'Camiseta graphic urban',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-pack-3-basicas'].id,
                url: IMG.tshirt_white,
                altText: 'Pack 3 camisetas brancas',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-ed-limitada-ss24'].id,
                url: IMG.tshirt_navy,
                altText: 'Camiseta edição limitada SS24',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-muscle-fit'].id,
                url: IMG.tshirt_black,
                altText: 'Camiseta muscle fit preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['regata-feminina-canelada'].id,
                url: IMG.tshirt_crop,
                altText: 'Regata feminina canelada',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-dryfit-performance'].id,
                url: IMG.tshirt_black,
                altText: 'Camiseta dryfit preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-tie-dye-artesanal'].id,
                url: IMG.tshirt_red,
                altText: 'Camiseta tie-dye artesanal',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['camiseta-listrada-nautica'].id,
                url: IMG.tshirt_navy,
                altText: 'Camiseta listrada náutica',
                position: 1,
                isPrimary: true,
            },

            {
                productId: pm['calca-cargo-utilitaria'].id,
                url: IMG.pants_cargo,
                altText: 'Calça cargo verde militar',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-slim-chino'].id,
                url: IMG.pants_chino,
                altText: 'Calça chino areia',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-jogger-fleece'].id,
                url: IMG.pants_jogger,
                altText: 'Calça jogger fleece preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-jeans-slim'].id,
                url: IMG.pants_jeans,
                altText: 'Calça jeans slim stone',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-wide-leg-jeans'].id,
                url: IMG.pants_jeans,
                altText: 'Calça wide leg jeans',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-alfaiataria-slim'].id,
                url: IMG.pants_formal,
                altText: 'Calça alfaiataria slim',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['legging-feminina-supplex'].id,
                url: IMG.pants_jogger,
                altText: 'Legging feminina supplex',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['bermuda-cargo-masculina'].id,
                url: IMG.pants_cargo,
                altText: 'Bermuda cargo masculina',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-moletom-oversized'].id,
                url: IMG.pants_jogger,
                altText: 'Calça moletom oversized',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['calca-ciclista-feminina'].id,
                url: IMG.pants_jogger,
                altText: 'Calça ciclista feminina',
                position: 1,
                isPrimary: true,
            },

            {
                productId: pm['tenis-runner-pro'].id,
                url: IMG.shoe_runner,
                altText: 'Tênis runner pro preto',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['tenis-runner-pro'].id,
                url: IMG.shoe_runner2,
                altText: 'Tênis runner pro lateral',
                position: 2,
                isPrimary: false,
            },
            {
                productId: pm['tenis-casual-urbano'].id,
                url: IMG.shoe_casual,
                altText: 'Tênis casual urbano branco',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['chinelo-slide-borracha'].id,
                url: IMG.shoe_sandal,
                altText: 'Chinelo slide borracha',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['bota-couro-cano-curto'].id,
                url: IMG.shoe_boot,
                altText: 'Bota couro cano curto',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['sapatenis-couro-premium'].id,
                url: IMG.shoe_loafer,
                altText: 'Sapatênis couro premium',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['tenis-plataforma-feminino'].id,
                url: IMG.shoe_casual,
                altText: 'Tênis plataforma feminino',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['sandalia-rasteira-tiras'].id,
                url: IMG.shoe_sandal,
                altText: 'Sandália rasteira tiras',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['tenis-high-top-lona'].id,
                url: IMG.shoe_highttop,
                altText: 'Tênis high top lona',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['loafer-mocassim-couro'].id,
                url: IMG.shoe_loafer,
                altText: 'Loafer mocassim couro',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['tenis-trail-outdoor'].id,
                url: IMG.shoe_runner,
                altText: 'Tênis trail outdoor',
                position: 1,
                isPrimary: true,
            },

            {
                productId: pm['jaqueta-bomber-premium'].id,
                url: IMG.jacket_bomber,
                altText: 'Jaqueta bomber preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['jaqueta-bomber-premium'].id,
                url: IMG.jacket_denim,
                altText: 'Jaqueta bomber costas',
                position: 2,
                isPrimary: false,
            },
            {
                productId: pm['jaqueta-corta-vento'].id,
                url: IMG.jacket_wind,
                altText: 'Jaqueta corta-vento azul',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['jaqueta-jeans-oversized'].id,
                url: IMG.jacket_denim,
                altText: 'Jaqueta jeans oversized',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['jaqueta-couro-biker'].id,
                url: IMG.jacket_leather,
                altText: 'Jaqueta couro biker preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['colete-puffer-sem-manga'].id,
                url: IMG.jacket_puffer,
                altText: 'Colete puffer sem manga',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['jaqueta-moletom-canguru'].id,
                url: IMG.jacket_bomber,
                altText: 'Jaqueta moletom canguru preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['jaqueta-sherpa-forrada'].id,
                url: IMG.jacket_denim,
                altText: 'Jaqueta sherpa forrada',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['blazer-linho-casual'].id,
                url: IMG.jacket_bomber,
                altText: 'Blazer linho casual',
                position: 1,
                isPrimary: true,
            },

            {
                productId: pm['bone-dad-hat'].id,
                url: IMG.cap_dad,
                altText: 'Boné dad hat preto',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['bone-snapback-aba-reta'].id,
                url: IMG.cap_snapback,
                altText: 'Boné snapback aba reta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['mochila-urban-20l'].id,
                url: IMG.bag_backpack,
                altText: 'Mochila urban 20L',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['kit-meias-cano-medio-5'].id,
                url: IMG.socks,
                altText: 'Kit meias cano médio',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['carteira-slim-couro'].id,
                url: IMG.wallet,
                altText: 'Carteira slim couro',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['oculos-sol-polarizado'].id,
                url: IMG.sunglasses,
                altText: 'Óculos de sol polarizado',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['cinto-couro-trancado'].id,
                url: IMG.belt_leather,
                altText: 'Cinto couro trançado',
                position: 1,
                isPrimary: true,
            },
            {
                productId: pm['necessaire-premium-couro'].id,
                url: IMG.bag_tote,
                altText: 'Nécessaire premium couro',
                position: 1,
                isPrimary: true,
            },
        ]);
        console.log('✅ Imagens inseridas.\n');

        console.log('🏠 Inserindo seções da home...');
        await db.insert(homeSections).values([
            {
                slug: 'top-selling',
                title: 'Mais Vendidos',
                type: 'top_selling',
                sortOrder: 1,
                isActive: true,
                filterJson: { limit: 10 },
            },
            {
                slug: 'new-in',
                title: 'Novidades',
                type: 'new_in',
                sortOrder: 2,
                isActive: true,
                filterJson: { limit: 8, daysAgo: 30 },
            },
            {
                slug: 'on-sale',
                title: 'Promoções',
                type: 'on_sale',
                sortOrder: 3,
                isActive: true,
                filterJson: { limit: 8 },
            },
            {
                slug: 'free-shipping',
                title: 'Frete Grátis',
                type: 'free_shipping',
                sortOrder: 4,
                isActive: true,
                filterJson: { limit: 6 },
            },
        ] as (typeof homeSections.$inferInsert)[]);
        console.log('✅ Seções da home inseridas.\n');
		
        console.log('⭐ Inserindo reviews...');
        await db.insert(productReviews).values([
            {
                productId: pm['camiseta-oversized-cotton'].id,
                userId: ana.id,
                rating: 5,
                title: 'Perfeita!',
                comment:
                    'Super confortável, caimento incrível. Recomendo muito!',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['camiseta-oversized-cotton'].id,
                userId: joao.id,
                rating: 4,
                title: 'Muito boa',
                comment: 'Ótima qualidade, só achei o tamanho um pouco grande.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['camiseta-basic-slim'].id,
                userId: joao.id,
                rating: 4,
                title: 'Boa compra',
                comment: 'Camiseta simples e de qualidade. Uso no dia a dia.',
                isVerifiedPurchase: false,
                status: 'approved',
            },
            {
                productId: pm['polo-pique-premium'].id,
                userId: ana.id,
                rating: 5,
                title: 'Elegante!',
                comment: 'Qualidade excelente, acabamento perfeito.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['calca-cargo-utilitaria'].id,
                userId: ana.id,
                rating: 5,
                title: 'Excelente!',
                comment:
                    'Calça muito estilosa e com bastante espaço nos bolsos.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['calca-cargo-utilitaria'].id,
                userId: joao.id,
                rating: 5,
                title: 'Top demais',
                comment: 'Material resistente e caimento perfeito.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['calca-jeans-slim'].id,
                userId: joao.id,
                rating: 4,
                title: 'Muito bom',
                comment: 'Jeans com ótimo caimento, elastano faz diferença.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['tenis-runner-pro'].id,
                userId: ana.id,
                rating: 5,
                title: 'Melhor tênis!',
                comment: 'Amortecimento incrível, uso para corridas diárias.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['tenis-runner-pro'].id,
                userId: joao.id,
                rating: 5,
                title: 'Vale cada centavo',
                comment: 'Qualidade surpreendente pelo preço. Super recomendo.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['jaqueta-bomber-premium'].id,
                userId: joao.id,
                rating: 5,
                title: 'Jaqueta incrível',
                comment: 'Forro excelente, design atemporal. Já comprei duas!',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['tenis-casual-urbano'].id,
                userId: ana.id,
                rating: 4,
                title: 'Lindo!',
                comment: 'Design minimalista que combina com tudo.',
                isVerifiedPurchase: false,
                status: 'approved',
            },
            {
                productId: pm['bone-dad-hat'].id,
                userId: ana.id,
                rating: 5,
                title: 'Adorei',
                comment: 'Qualidade ótima e ajuste perfeito.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['legging-feminina-supplex'].id,
                userId: ana.id,
                rating: 5,
                title: 'Incrível!',
                comment: 'Compressão ótima, não desce durante a corrida.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['mochila-urban-20l'].id,
                userId: joao.id,
                rating: 4,
                title: 'Prática',
                comment: 'Cabe notebook, marmita e ainda sobra espaço.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: pm['jaqueta-couro-biker'].id,
                userId: joao.id,
                rating: 5,
                title: 'Estilosa!',
                comment:
                    'Couro sintético de altíssima qualidade, zíperes bem resistentes.',
                isVerifiedPurchase: false,
                status: 'approved',
            },
            {
                productId: pm['blazer-linho-casual'].id,
                userId: ana.id,
                rating: 5,
                title: 'Perfeito pro verão',
                comment: 'Leve, fresco e elegante. Ótimo para reuniões.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
        ]);
        console.log('✅ Reviews inseridos.\n');

        console.log('❤️  Inserindo wishlists...');
        const insertedWishlists = await db
            .insert(wishlists)
            .values([
                { userId: ana.id, name: 'Meus Favoritos', isDefault: true },
                { userId: ana.id, name: 'Presente', isDefault: false },
                { userId: joao.id, name: 'Meus Favoritos', isDefault: true },
            ])
            .returning();
        const [anaDefault, anaPresente, joaoDefault] = insertedWishlists;
        await db
            .insert(wishlistItems)
            .values([
                {
                    wishlistId: anaDefault.id,
                    productId: pm['camiseta-oversized-cotton'].id,
                },
                {
                    wishlistId: anaDefault.id,
                    productId: pm['tenis-runner-pro'].id,
                },
                {
                    wishlistId: anaDefault.id,
                    productId: pm['jaqueta-bomber-premium'].id,
                },
                {
                    wishlistId: anaDefault.id,
                    productId: pm['legging-feminina-supplex'].id,
                },
                {
                    wishlistId: anaPresente.id,
                    productId: pm['bone-dad-hat'].id,
                },
                {
                    wishlistId: anaPresente.id,
                    productId: pm['tenis-casual-urbano'].id,
                },
                {
                    wishlistId: joaoDefault.id,
                    productId: pm['calca-cargo-utilitaria'].id,
                },
                {
                    wishlistId: joaoDefault.id,
                    productId: pm['jaqueta-bomber-premium'].id,
                },
                {
                    wishlistId: joaoDefault.id,
                    productId: pm['jaqueta-couro-biker'].id,
                },
            ])
            .onConflictDoNothing();
        console.log('✅ Wishlists inseridas.\n');

        console.log('🛒 Inserindo carrinhos...');

        const skuRows = await db
            .select()
            .from(productSkus)
            .where(eq(productSkus.skuCode, 'TS-OVS-M-BLK'));
        const skuOvsMBlk = skuRows[0];

        const skuRunnerRows = await db
            .select()
            .from(productSkus)
            .where(eq(productSkus.skuCode, 'TN-RUN-41'));
        const skuRunner41 = skuRunnerRows[0];

        const skuCargoRows = await db
            .select()
            .from(productSkus)
            .where(eq(productSkus.skuCode, 'CC-UTIL-40'));
        const skuCargo40 = skuCargoRows[0];

        const skuBomberRows = await db
            .select()
            .from(productSkus)
            .where(eq(productSkus.skuCode, 'JK-BMB-M'));
        const skuBomberM = skuBomberRows[0];

        const insertedCarts = await db
            .insert(carts)
            .values([
                {
                    userId: ana.id,
                    subtotal: String(p(129.9) + p(399.9)),
                    shippingCost: '800',
                    taxAmount: '0',
                    total: String(p(129.9) + p(399.9) + 800),
                },
                {
                    userId: joao.id,
                    subtotal: String(p(249.9) + p(459.9)),
                    shippingCost: '800',
                    taxAmount: '0',
                    total: String(p(249.9) + p(459.9) + 800),
                },
            ])
            .returning();
        const [anaCart, joaoCart] = insertedCarts;

        await db.insert(cartItems).values([
            {
                cartId: anaCart.id,
                productId: pm['camiseta-oversized-cotton'].id,
                skuId: skuOvsMBlk.id,
                quantity: 1,
                priceSnapshot: String(p(129.9)),
            },
            {
                cartId: anaCart.id,
                productId: pm['tenis-runner-pro'].id,
                skuId: skuRunner41.id,
                quantity: 1,
                priceSnapshot: String(p(399.9)),
            },
            {
                cartId: joaoCart.id,
                productId: pm['calca-cargo-utilitaria'].id,
                skuId: skuCargo40.id,
                quantity: 1,
                priceSnapshot: String(p(249.9)),
            },
            {
                cartId: joaoCart.id,
                productId: pm['jaqueta-bomber-premium'].id,
                skuId: skuBomberM.id,
                quantity: 1,
                priceSnapshot: String(p(459.9)),
            },
        ]);
        console.log('✅ Carrinhos inseridos.\n');

        const simpleProducts = insertedProducts.filter(
            (p) => !p.hasVariations,
        ).length;
        const outOfStock = insertedProducts.filter(
            (p) => !p.hasVariations && p.stock === 0,
        ).length;

        console.log('═══════════════════════════════════════════');
        console.log('✅ Seed concluído!\n');
        console.log(`   Marcas:                  ${insertedBrands.length}`);
        console.log(`   Categorias:              ${insertedCategories.length}`);
        console.log(`   Produtos totais:         ${insertedProducts.length}`);
        console.log(
            `     ↳ Com variações:       ${
                insertedProducts.length - simpleProducts
            }`,
        );
        console.log(`     ↳ Simples (sem var.):  ${simpleProducts}`);
        console.log(
            `     ↳ Fora de estoque*:    ${outOfStock} (+ SKUs c/ stock=0)`,
        );
        console.log(`   SKUs:                    ${totalSkus}`);
        console.log(`   Usuários:                ${users.length}`);
        console.log('═══════════════════════════════════════════');
        console.log('\n🔑 Credenciais de teste:');
        console.log('   ana.silva@email.com    / Senha123!');
        console.log('   joao.santos@email.com  / Senha123!');
        console.log('   admin@nero.com         / Admin123!');
        console.log('\n📋 Distribuição de produtos:');
        console.log('   Camisetas:  14  |  Calças: 10');
        console.log('   Calçados:   10  |  Jaquetas: 8  |  Acessórios: 8');
    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

seed().catch(console.error);
