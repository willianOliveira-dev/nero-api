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
import { productVariants } from '../lib/db/schemas/product-variants.schema';
import { products } from '../lib/db/schemas/products.schema';
import { userAddresses } from '../lib/db/schemas/user-addresses.schema';
import { userProfiles } from '../lib/db/schemas/user-profiles.schema';
import { wishlistItems, wishlists } from '../lib/db/schemas/wishlists.schema';
import { Price } from '../shared/utils/price.util';

const client = postgres(env.DATABASE_URL);
const db = drizzle(client, { schema });

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
        await db.delete(productVariants);
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
                    iconUrl:
                        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=400&fit=crop',
                    sortOrder: 1,
                    isActive: true,
                },
                {
                    name: 'Calças',
                    slug: 'calcas',
                    parentId: null,
                    iconUrl:
                        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&h=400&fit=crop',
                    sortOrder: 2,
                    isActive: true,
                },
                {
                    name: 'Calçados',
                    slug: 'calcados',
                    parentId: null,
                    iconUrl:
                        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=400&fit=crop',
                    sortOrder: 3,
                    isActive: true,
                },
                {
                    name: 'Jaquetas',
                    slug: 'jaquetas',
                    parentId: null,
                    iconUrl:
                        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=400&fit=crop',
                    sortOrder: 4,
                    isActive: true,
                },
                {
                    name: 'Acessórios',
                    slug: 'acessorios',
                    parentId: null,
                    iconUrl:
                        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop',
                    imageUrl:
                        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=400&fit=crop',
                    sortOrder: 5,
                    isActive: true,
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
                value: '10',
                minOrderValue: '10000',
                maxUses: 1000,
                usedCount: 0,
                expiresAt: new Date('2026-12-31'),
                isActive: true,
            },
            {
                code: 'FRETEGRATIS',
                type: 'free_shipping',
                value: '0',
                minOrderValue: '15000',
                maxUses: 500,
                usedCount: 0,
                expiresAt: new Date('2026-12-31'),
                isActive: true,
            },
            {
                code: 'NEGRO20',
                type: 'percentage',
                value: '20',
                minOrderValue: '20000',
                maxUses: 200,
                usedCount: 0,
                expiresAt: new Date('2026-11-30'),
                isActive: true,
            },
            {
                code: 'DESC50',
                type: 'fixed',
                value: '5000',
                minOrderValue: '30000',
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

        console.log('👤 Inserindo perfis...');
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
        console.log('✅ Perfis inseridos.\n');

        console.log('📍 Inserindo endereços...');
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
        console.log('✅ Endereços inseridos.\n');

        console.log('👕 Inserindo produtos...');
        const p = (reais: number) => Price.toInt(reais);

        const insertedProducts = await db
            .insert(products)
            .values([
                {
                    name: 'Camiseta Oversized Cotton',
                    slug: 'camiseta-oversized-cotton',
                    description:
                        'Camiseta oversized em algodão 100% orgânico. Corte relaxado, costuras reforçadas e toque ultra macio.',
                    basePrice: p(129.9),
                    originalPrice: p(159.9),
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
                    description:
                        'Camiseta slim fit para o dia a dia. Tecido respirável com elastano para maior conforto.',
                    basePrice: p(89.9),
                    originalPrice: null,
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
                    description:
                        'Camiseta cropped moderna com caimento perfeito. Ideal para looks casuais e esportivos.',
                    basePrice: p(79.9),
                    originalPrice: p(99.9),
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
                    name: 'Calça Cargo Utilitária',
                    slug: 'calca-cargo-utilitaria',
                    description:
                        'Calça cargo com bolsos laterais funcionais. Tecido resistente com toque macio.',
                    basePrice: p(249.9),
                    originalPrice: p(299.9),
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
                    description:
                        'Calça chino slim com tecido premium. Versátil para ocasiões casuais e semi-formais.',
                    basePrice: p(199.9),
                    originalPrice: null,
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
                    name: 'Tênis Runner Pro',
                    slug: 'tenis-runner-pro',
                    description:
                        'Tênis running com amortecimento responsivo e solado de borracha de alta durabilidade.',
                    basePrice: p(399.9),
                    originalPrice: p(459.9),
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
                    description:
                        'Tênis casual com design urbano minimalista. Cabedal em couro sintético premium.',
                    basePrice: p(289.9),
                    originalPrice: p(329.9),
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
                    name: 'Jaqueta Bomber Premium',
                    slug: 'jaqueta-bomber-premium',
                    description:
                        'Jaqueta bomber com forro de qualidade. Design atemporal que combina com qualquer look.',
                    basePrice: p(459.9),
                    originalPrice: p(549.9),
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
                    description:
                        'Jaqueta corta-vento leve e impermeável. Ideal para atividades ao ar livre.',
                    basePrice: p(319.9),
                    originalPrice: null,
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
                    name: 'Boné Dad Hat',
                    slug: 'bone-dad-hat',
                    description:
                        'Boné dad hat com bordado delicado. Regulagem ajustável para todos os tamanhos.',
                    basePrice: p(89.9),
                    originalPrice: p(109.9),
                    categoryId: catMap['acessorios'],
                    brandId: brandMap['nero-basics'],
                    gender: 'unisex',
                    status: 'active',
                    freeShipping: false,
                    soldCount: 321,
                    ratingAvg: '4.50',
                    ratingCount: 115,
                },
            ])
            .returning();
        const [
            camOversized,
            camBasic,
            camCropped,
            calcaCargo,
            calcaChino,
            tenisRunner,
            tenisCasual,
            jaquetaBomber,
            jaquetaCorta,
            bone,
        ] = insertedProducts;
        console.log(`✅ ${insertedProducts.length} produtos inseridos.\n`);

        console.log('🎨 Inserindo variantes...');
        const insertedVariants = await db
            .insert(productVariants)
            .values([
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-P-BLK',
                    price: null,
                    stock: 52,
                    attributes: {
                        size: 'P',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-M-BLK',
                    price: null,
                    stock: 78,
                    attributes: {
                        size: 'M',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-G-BLK',
                    price: null,
                    stock: 63,
                    attributes: {
                        size: 'G',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-GG-BLK',
                    price: null,
                    stock: 30,
                    attributes: {
                        size: 'GG',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-P-WHT',
                    price: null,
                    stock: 45,
                    attributes: {
                        size: 'P',
                        color: 'Branco',
                        hexColor: '#ffffff',
                    },
                    isActive: true,
                },
                {
                    productId: camOversized.id,
                    sku: 'TS-OVS-M-WHT',
                    price: null,
                    stock: 60,
                    attributes: {
                        size: 'M',
                        color: 'Branco',
                        hexColor: '#ffffff',
                    },
                    isActive: true,
                },
                {
                    productId: camBasic.id,
                    sku: 'TS-BSC-P',
                    price: null,
                    stock: 80,
                    attributes: {
                        size: 'P',
                        color: 'Cinza',
                        hexColor: '#808080',
                    },
                    isActive: true,
                },
                {
                    productId: camBasic.id,
                    sku: 'TS-BSC-M',
                    price: null,
                    stock: 95,
                    attributes: {
                        size: 'M',
                        color: 'Cinza',
                        hexColor: '#808080',
                    },
                    isActive: true,
                },
                {
                    productId: camBasic.id,
                    sku: 'TS-BSC-G',
                    price: null,
                    stock: 70,
                    attributes: {
                        size: 'G',
                        color: 'Cinza',
                        hexColor: '#808080',
                    },
                    isActive: true,
                },
                {
                    productId: camBasic.id,
                    sku: 'TS-BSC-GG',
                    price: null,
                    stock: 40,
                    attributes: {
                        size: 'GG',
                        color: 'Cinza',
                        hexColor: '#808080',
                    },
                    isActive: true,
                },
                {
                    productId: camCropped.id,
                    sku: 'TS-CRP-PP',
                    price: null,
                    stock: 35,
                    attributes: {
                        size: 'PP',
                        color: 'Rosa',
                        hexColor: '#ffb6c1',
                    },
                    isActive: true,
                },
                {
                    productId: camCropped.id,
                    sku: 'TS-CRP-P',
                    price: null,
                    stock: 50,
                    attributes: {
                        size: 'P',
                        color: 'Rosa',
                        hexColor: '#ffb6c1',
                    },
                    isActive: true,
                },
                {
                    productId: camCropped.id,
                    sku: 'TS-CRP-M',
                    price: null,
                    stock: 55,
                    attributes: {
                        size: 'M',
                        color: 'Rosa',
                        hexColor: '#ffb6c1',
                    },
                    isActive: true,
                },
                {
                    productId: calcaCargo.id,
                    sku: 'CC-UTIL-38',
                    price: null,
                    stock: 25,
                    attributes: {
                        size: '38',
                        color: 'Verde Militar',
                        hexColor: '#4b5320',
                    },
                    isActive: true,
                },
                {
                    productId: calcaCargo.id,
                    sku: 'CC-UTIL-40',
                    price: null,
                    stock: 34,
                    attributes: {
                        size: '40',
                        color: 'Verde Militar',
                        hexColor: '#4b5320',
                    },
                    isActive: true,
                },
                {
                    productId: calcaCargo.id,
                    sku: 'CC-UTIL-42',
                    price: null,
                    stock: 41,
                    attributes: {
                        size: '42',
                        color: 'Verde Militar',
                        hexColor: '#4b5320',
                    },
                    isActive: true,
                },
                {
                    productId: calcaCargo.id,
                    sku: 'CC-UTIL-44',
                    price: null,
                    stock: 18,
                    attributes: {
                        size: '44',
                        color: 'Verde Militar',
                        hexColor: '#4b5320',
                    },
                    isActive: true,
                },
                {
                    productId: calcaChino.id,
                    sku: 'CH-SLM-38',
                    price: null,
                    stock: 30,
                    attributes: {
                        size: '38',
                        color: 'Areia',
                        hexColor: '#c2b280',
                    },
                    isActive: true,
                },
                {
                    productId: calcaChino.id,
                    sku: 'CH-SLM-40',
                    price: null,
                    stock: 45,
                    attributes: {
                        size: '40',
                        color: 'Areia',
                        hexColor: '#c2b280',
                    },
                    isActive: true,
                },
                {
                    productId: calcaChino.id,
                    sku: 'CH-SLM-42',
                    price: null,
                    stock: 38,
                    attributes: {
                        size: '42',
                        color: 'Areia',
                        hexColor: '#c2b280',
                    },
                    isActive: true,
                },
                {
                    productId: tenisRunner.id,
                    sku: 'TN-RUN-38',
                    price: null,
                    stock: 20,
                    attributes: { size: '38', color: 'Preto/Branco' },
                    isActive: true,
                },
                {
                    productId: tenisRunner.id,
                    sku: 'TN-RUN-39',
                    price: null,
                    stock: 28,
                    attributes: { size: '39', color: 'Preto/Branco' },
                    isActive: true,
                },
                {
                    productId: tenisRunner.id,
                    sku: 'TN-RUN-40',
                    price: null,
                    stock: 32,
                    attributes: { size: '40', color: 'Preto/Branco' },
                    isActive: true,
                },
                {
                    productId: tenisRunner.id,
                    sku: 'TN-RUN-41',
                    price: null,
                    stock: 27,
                    attributes: { size: '41', color: 'Preto/Branco' },
                    isActive: true,
                },
                {
                    productId: tenisRunner.id,
                    sku: 'TN-RUN-42',
                    price: null,
                    stock: 22,
                    attributes: { size: '42', color: 'Preto/Branco' },
                    isActive: true,
                },
                {
                    productId: tenisCasual.id,
                    sku: 'TN-CSL-39',
                    price: null,
                    stock: 15,
                    attributes: { size: '39', color: 'Branco' },
                    isActive: true,
                },
                {
                    productId: tenisCasual.id,
                    sku: 'TN-CSL-40',
                    price: null,
                    stock: 22,
                    attributes: { size: '40', color: 'Branco' },
                    isActive: true,
                },
                {
                    productId: tenisCasual.id,
                    sku: 'TN-CSL-41',
                    price: null,
                    stock: 18,
                    attributes: { size: '41', color: 'Branco' },
                    isActive: true,
                },
                {
                    productId: jaquetaBomber.id,
                    sku: 'JK-BMB-P',
                    price: null,
                    stock: 15,
                    attributes: {
                        size: 'P',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: jaquetaBomber.id,
                    sku: 'JK-BMB-M',
                    price: null,
                    stock: 20,
                    attributes: {
                        size: 'M',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: jaquetaBomber.id,
                    sku: 'JK-BMB-G',
                    price: null,
                    stock: 12,
                    attributes: {
                        size: 'G',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
                {
                    productId: jaquetaCorta.id,
                    sku: 'JK-CTV-P',
                    price: null,
                    stock: 10,
                    attributes: {
                        size: 'P',
                        color: 'Azul Marinho',
                        hexColor: '#001f5b',
                    },
                    isActive: true,
                },
                {
                    productId: jaquetaCorta.id,
                    sku: 'JK-CTV-M',
                    price: null,
                    stock: 14,
                    attributes: {
                        size: 'M',
                        color: 'Azul Marinho',
                        hexColor: '#001f5b',
                    },
                    isActive: true,
                },
                {
                    productId: jaquetaCorta.id,
                    sku: 'JK-CTV-G',
                    price: null,
                    stock: 8,
                    attributes: {
                        size: 'G',
                        color: 'Azul Marinho',
                        hexColor: '#001f5b',
                    },
                    isActive: true,
                },
                {
                    productId: bone.id,
                    sku: 'BN-DAD-UNI',
                    price: null,
                    stock: 120,
                    attributes: {
                        size: 'Único',
                        color: 'Preto',
                        hexColor: '#1a1a1a',
                    },
                    isActive: true,
                },
            ])
            .returning();
        console.log(`✅ ${insertedVariants.length} variantes inseridas.\n`);

        console.log('🖼️  Inserindo imagens...');
        await db.insert(productImages).values([
            {
                productId: camOversized.id,
                url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop',
                altText: 'Camiseta oversized preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: camOversized.id,
                url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop',
                altText: 'Camiseta oversized detalhe',
                position: 2,
                isPrimary: false,
            },
            {
                productId: camBasic.id,
                url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop',
                altText: 'Camiseta basic cinza',
                position: 1,
                isPrimary: true,
            },
            {
                productId: camCropped.id,
                url: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&h=800&fit=crop',
                altText: 'Camiseta cropped rosa',
                position: 1,
                isPrimary: true,
            },
            {
                productId: calcaCargo.id,
                url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop',
                altText: 'Calça cargo verde militar',
                position: 1,
                isPrimary: true,
            },
            {
                productId: calcaCargo.id,
                url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop',
                altText: 'Calça cargo detalhe bolso',
                position: 2,
                isPrimary: false,
            },
            {
                productId: calcaChino.id,
                url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop',
                altText: 'Calça chino areia',
                position: 1,
                isPrimary: true,
            },
            {
                productId: tenisRunner.id,
                url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop',
                altText: 'Tênis runner preto',
                position: 1,
                isPrimary: true,
            },
            {
                productId: tenisRunner.id,
                url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
                altText: 'Tênis runner lateral',
                position: 2,
                isPrimary: false,
            },
            {
                productId: tenisCasual.id,
                url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop',
                altText: 'Tênis casual branco',
                position: 1,
                isPrimary: true,
            },
            {
                productId: jaquetaBomber.id,
                url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop',
                altText: 'Jaqueta bomber preta',
                position: 1,
                isPrimary: true,
            },
            {
                productId: jaquetaBomber.id,
                url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&h=800&fit=crop',
                altText: 'Jaqueta bomber costas',
                position: 2,
                isPrimary: false,
            },
            {
                productId: jaquetaCorta.id,
                url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop',
                altText: 'Jaqueta corta-vento azul',
                position: 1,
                isPrimary: true,
            },
            {
                productId: bone.id,
                url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop',
                altText: 'Boné dad hat preto',
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
            {
                slug: 'para-ele',
                title: 'Para Ele',
                type: 'by_gender',
                sortOrder: 5,
                isActive: true,
                filterJson: { gender: 'men', limit: 8 },
            },
            {
                slug: 'para-ela',
                title: 'Para Ela',
                type: 'by_gender',
                sortOrder: 6,
                isActive: true,
                filterJson: { gender: 'women', limit: 8 },
            },
        ] as (typeof homeSections.$inferInsert)[]);
        console.log('✅ Seções da home inseridas.\n');

        console.log('⭐ Inserindo reviews...');
        await db.insert(productReviews).values([
            {
                productId: camOversized.id,
                userId: ana.id,
                rating: 5,
                title: 'Perfeita!',
                comment:
                    'Super confortável, caimento incrível. Recomendo muito!',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: camOversized.id,
                userId: joao.id,
                rating: 4,
                title: 'Muito boa',
                comment: 'Ótima qualidade, só achei o tamanho um pouco grande.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: camBasic.id,
                userId: joao.id,
                rating: 4,
                title: 'Boa compra',
                comment: 'Camiseta simples e de qualidade. Uso no dia a dia.',
                isVerifiedPurchase: false,
                status: 'approved',
            },
            {
                productId: calcaCargo.id,
                userId: ana.id,
                rating: 5,
                title: 'Excelente!',
                comment:
                    'Calça muito estilosa e com bastante espaço nos bolsos.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: calcaCargo.id,
                userId: joao.id,
                rating: 5,
                title: 'Top demais',
                comment:
                    'Material resistente e caimento perfeito para o meu tipo.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: tenisRunner.id,
                userId: ana.id,
                rating: 5,
                title: 'Melhor tênis!',
                comment: 'Amortecimento incrível, uso para corridas diárias.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: tenisRunner.id,
                userId: joao.id,
                rating: 5,
                title: 'Vale cada centavo',
                comment: 'Qualidade surpreendente pelo preço. Super recomendo.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: jaquetaBomber.id,
                userId: joao.id,
                rating: 5,
                title: 'Jaqueta incrível',
                comment: 'Forro excelente, design atemporal. Ja comprei duas!',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: tenisCasual.id,
                userId: ana.id,
                rating: 4,
                title: 'Lindo!',
                comment: 'Design minimalista que combina com tudo.',
                isVerifiedPurchase: false,
                status: 'approved',
            },
            {
                productId: bone.id,
                userId: ana.id,
                rating: 5,
                title: 'Adorei',
                comment: 'Qualidade ótima e ajuste perfeito.',
                isVerifiedPurchase: true,
                status: 'approved',
            },
            {
                productId: camCropped.id,
                userId: joao.id,
                rating: 3,
                title: 'Ok',
                comment: 'Esperava mais pelo preço, mas é ok.',
                isVerifiedPurchase: false,
                status: 'pending',
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
                { wishlistId: anaDefault.id, productId: camOversized.id },
                { wishlistId: anaDefault.id, productId: tenisRunner.id },
                { wishlistId: anaDefault.id, productId: jaquetaBomber.id },
                { wishlistId: anaPresente.id, productId: bone.id },
                { wishlistId: anaPresente.id, productId: tenisCasual.id },
                { wishlistId: joaoDefault.id, productId: calcaCargo.id },
                { wishlistId: joaoDefault.id, productId: jaquetaBomber.id },
            ])
            .onConflictDoNothing();
        console.log('✅ Wishlists inseridas.\n');

        console.log('🛒 Inserindo carrinhos...');
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
        const varBySkuMap = Object.fromEntries(
            insertedVariants.map((v) => [v.sku, v]),
        );
        await db.insert(cartItems).values([
            {
                cartId: anaCart.id,
                productId: camOversized.id,
                variantId: varBySkuMap['TS-OVS-M-BLK'].id,
                quantity: 1,
                priceSnapshot: String(p(129.9)),
            },
            {
                cartId: anaCart.id,
                productId: tenisRunner.id,
                variantId: varBySkuMap['TN-RUN-41'].id,
                quantity: 1,
                priceSnapshot: String(p(399.9)),
            },
            {
                cartId: joaoCart.id,
                productId: calcaCargo.id,
                variantId: varBySkuMap['CC-UTIL-40'].id,
                quantity: 1,
                priceSnapshot: String(p(249.9)),
            },
            {
                cartId: joaoCart.id,
                productId: jaquetaBomber.id,
                variantId: varBySkuMap['JK-BMB-M'].id,
                quantity: 1,
                priceSnapshot: String(p(459.9)),
            },
        ]);
        console.log('✅ Carrinhos inseridos.\n');

        console.log('═══════════════════════════════════════');
        console.log('✅ Seed concluído!\n');
        console.log(`   Marcas:      ${insertedBrands.length}`);
        console.log(`   Categorias:  ${insertedCategories.length}`);
        console.log(`   Produtos:    ${insertedProducts.length}`);
        console.log(`   Variantes:   ${insertedVariants.length}`);
        console.log(`   Usuários:    ${users.length}`);
        console.log('═══════════════════════════════════════');
        console.log('\n🔑 Credenciais de teste:');
        console.log('   ana.silva@email.com   / Senha123!');
        console.log('   joao.santos@email.com / Senha123!');
        console.log('   admin@nero.com        / Admin123!');
    } catch (error) {
        console.error('❌ Erro durante o seed:', error);
        throw error;
    } finally {
        await client.end();
    }
}

seed().catch(console.error);
