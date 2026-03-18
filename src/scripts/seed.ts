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

// ── Helpers ───────────────────────────────────────────────────
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
			if (!optionId)
				throw new Error(
					`Option "${optionValue}" not found for "${typeName}"`,
				);

			await db.insert(skuOptionMap).values({
				skuId: sku.id,
				variationOptionId: optionId,
			});
		}
		insertedSkus.push(sku);
	}

	return insertedSkus;
}

// ── Main Seed ─────────────────────────────────────────────────

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

		// ── Brands ────────────────────────────────────────────
		console.log('🏷️  Inserindo marcas...');
		const insertedBrands = await db
			.insert(brands)
			.values([
				{ name: 'Nero Basics', slug: 'nero-basics', logoUrl: null, isActive: true },
				{ name: 'Nero Sport', slug: 'nero-sport', logoUrl: null, isActive: true },
				{ name: 'Nero Premium', slug: 'nero-premium', logoUrl: null, isActive: true },
			])
			.returning();
		const brandMap = Object.fromEntries(insertedBrands.map((b) => [b.slug, b.id]));
		console.log(`✅ ${insertedBrands.length} marcas inseridas.\n`);

		// ── Categories ────────────────────────────────────────
		console.log('📁 Inserindo categorias...');
		const insertedCategories = await db
			.insert(categories)
			.values([
				{
					name: 'Camisetas', slug: 'camisetas', parentId: null, sortOrder: 1, isActive: true,
					iconUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200&h=200&fit=crop',
					imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&h=400&fit=crop',
				},
				{
					name: 'Calças', slug: 'calcas', parentId: null, sortOrder: 2, isActive: true,
					iconUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200&h=200&fit=crop',
					imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=1200&h=400&fit=crop',
				},
				{
					name: 'Calçados', slug: 'calcados', parentId: null, sortOrder: 3, isActive: true,
					iconUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=200&h=200&fit=crop',
					imageUrl: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=400&fit=crop',
				},
				{
					name: 'Jaquetas', slug: 'jaquetas', parentId: null, sortOrder: 4, isActive: true,
					iconUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&h=200&fit=crop',
					imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&h=400&fit=crop',
				},
				{
					name: 'Acessórios', slug: 'acessorios', parentId: null, sortOrder: 5, isActive: true,
					iconUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200&h=200&fit=crop',
					imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=400&fit=crop',
				},
			])
			.returning();
		const catMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c.id]));
		console.log(`✅ ${insertedCategories.length} categorias inseridas.\n`);

		// ── Coupons ───────────────────────────────────────────
		console.log('🎟️  Inserindo cupons...');
		await db.insert(coupons).values([
			{ code: 'BEMVINDO10', type: 'percentage', value: '10', minOrderValue: '10000', maxUses: 1000, usedCount: 0, expiresAt: new Date('2026-12-31'), isActive: true },
			{ code: 'FRETEGRATIS', type: 'free_shipping', value: '0', minOrderValue: '15000', maxUses: 500, usedCount: 0, expiresAt: new Date('2026-12-31'), isActive: true },
			{ code: 'NEGRO20', type: 'percentage', value: '20', minOrderValue: '20000', maxUses: 200, usedCount: 0, expiresAt: new Date('2026-11-30'), isActive: true },
			{ code: 'DESC50', type: 'fixed', value: '5000', minOrderValue: '30000', maxUses: 100, usedCount: 0, expiresAt: new Date('2026-06-30'), isActive: true },
		]);
		console.log('✅ Cupons inseridos.\n');

		// ── Users ─────────────────────────────────────────────
		console.log('👤 Criando usuários...');
		const userDefs = [
			{ email: 'ana.silva@email.com', password: 'Senha123!', name: 'Ana Silva' },
			{ email: 'joao.santos@email.com', password: 'Senha123!', name: 'João Santos' },
			{ email: 'admin@nero.com', password: 'Admin123!', name: 'Admin Nero' },
		];
		const users: { id: string; name: string; email: string }[] = [];
		for (const def of userDefs) {
			try {
				const res = await auth.api.signUpEmail({ body: def });
				users.push(res.user as { id: string; name: string; email: string });
				console.log(`  ✔ ${def.name} criado`);
			} catch {
				const [existing] = await db.select().from(schema.user).where(eq(schema.user.email, def.email));
				if (existing) {
					users.push(existing as { id: string; name: string; email: string });
					console.log(`  ↩ ${def.name} já existe`);
				}
			}
		}
		const [ana, joao] = users;
		console.log(`✅ ${users.length} usuários prontos.\n`);

		// ── Profiles ──────────────────────────────────────────
		console.log('👤 Inserindo perfis...');
		await db.insert(userProfiles).values([
			{ userId: ana.id, genderPreference: 'women', phone: '+55 11 91234-5678' },
			{ userId: joao.id, genderPreference: 'men', phone: '+55 11 98765-4321' },
			{ userId: users[2].id, genderPreference: 'unisex' },
		]).onConflictDoNothing();
		console.log('✅ Perfis inseridos.\n');

		// ── Addresses ─────────────────────────────────────────
		console.log('📍 Inserindo endereços...');
		await db.insert(userAddresses).values([
			{ userId: ana.id, label: 'Casa', recipientName: 'Ana Silva', street: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP', zipCode: '01234-567', country: 'BR', complement: 'Apto 45', isDefault: true },
			{ userId: ana.id, label: 'Trabalho', recipientName: 'Ana Silva', street: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100', country: 'BR', complement: 'Sala 42', isDefault: false },
			{ userId: joao.id, label: 'Casa', recipientName: 'João Santos', street: 'Rua Augusta, 500', city: 'São Paulo', state: 'SP', zipCode: '01305-000', country: 'BR', complement: null, isDefault: true },
		]);
		console.log('✅ Endereços inseridos.\n');

		// ── Products (with new SKU-based architecture) ─────────
		console.log('👕 Inserindo produtos...');
		const insertedProducts = await db
			.insert(products)
			.values([
				{
					name: 'Camiseta Oversized Cotton', slug: 'camiseta-oversized-cotton', hasVariations: true,
					description: 'Camiseta oversized em algodão 100% orgânico. Corte relaxado, costuras reforçadas e toque ultra macio.',
					categoryId: catMap['camisetas'], brandId: brandMap['nero-basics'], gender: 'unisex', status: 'active',
					freeShipping: false, soldCount: 245, ratingAvg: '4.50', ratingCount: 89,
				},
				{
					name: 'Camiseta Basic Slim', slug: 'camiseta-basic-slim', hasVariations: true,
					description: 'Camiseta slim fit para o dia a dia. Tecido respirável com elastano para maior conforto.',
					categoryId: catMap['camisetas'], brandId: brandMap['nero-basics'], gender: 'men', status: 'active',
					freeShipping: false, soldCount: 412, ratingAvg: '4.20', ratingCount: 134,
				},
				{
					name: 'Camiseta Cropped Feminina', slug: 'camiseta-cropped-feminina', hasVariations: true,
					description: 'Camiseta cropped moderna com caimento perfeito. Ideal para looks casuais e esportivos.',
					categoryId: catMap['camisetas'], brandId: brandMap['nero-basics'], gender: 'women', status: 'active',
					freeShipping: false, soldCount: 178, ratingAvg: '4.70', ratingCount: 56,
				},
				{
					name: 'Calça Cargo Utilitária', slug: 'calca-cargo-utilitaria', hasVariations: true,
					description: 'Calça cargo com bolsos laterais funcionais. Tecido resistente com toque macio.',
					categoryId: catMap['calcas'], brandId: brandMap['nero-basics'], gender: 'men', status: 'active',
					freeShipping: true, soldCount: 156, ratingAvg: '4.80', ratingCount: 67,
				},
				{
					name: 'Calça Slim Chino', slug: 'calca-slim-chino', hasVariations: true,
					description: 'Calça chino slim com tecido premium. Versátil para ocasiões casuais e semi-formais.',
					categoryId: catMap['calcas'], brandId: brandMap['nero-basics'], gender: 'unisex', status: 'active',
					freeShipping: false, soldCount: 203, ratingAvg: '4.40', ratingCount: 91,
				},
				{
					name: 'Tênis Runner Pro', slug: 'tenis-runner-pro', hasVariations: true,
					description: 'Tênis running com amortecimento responsivo e solado de borracha de alta durabilidade.',
					categoryId: catMap['calcados'], brandId: brandMap['nero-sport'], gender: 'unisex', status: 'active',
					freeShipping: true, soldCount: 312, ratingAvg: '4.90', ratingCount: 142,
				},
				{
					name: 'Tênis Casual Urbano', slug: 'tenis-casual-urbano', hasVariations: true,
					description: 'Tênis casual com design urbano minimalista. Cabedal em couro sintético premium.',
					categoryId: catMap['calcados'], brandId: brandMap['nero-sport'], gender: 'unisex', status: 'active',
					freeShipping: false, soldCount: 189, ratingAvg: '4.60', ratingCount: 73,
				},
				{
					name: 'Jaqueta Bomber Premium', slug: 'jaqueta-bomber-premium', hasVariations: true,
					description: 'Jaqueta bomber com forro de qualidade. Design atemporal que combina com qualquer look.',
					categoryId: catMap['jaquetas'], brandId: brandMap['nero-premium'], gender: 'unisex', status: 'active',
					freeShipping: true, soldCount: 98, ratingAvg: '4.85', ratingCount: 44,
				},
				{
					name: 'Jaqueta Corta-Vento', slug: 'jaqueta-corta-vento', hasVariations: true,
					description: 'Jaqueta corta-vento leve e impermeável. Ideal para atividades ao ar livre.',
					categoryId: catMap['jaquetas'], brandId: brandMap['nero-sport'], gender: 'unisex', status: 'active',
					freeShipping: false, soldCount: 67, ratingAvg: '4.30', ratingCount: 28,
				},
				{
					// Boné é produto SIMPLES (sem variações) — apenas Tamanho Único
					name: 'Boné Dad Hat', slug: 'bone-dad-hat', hasVariations: false,
					description: 'Boné dad hat com bordado delicado. Regulagem ajustável para todos os tamanhos.',
					categoryId: catMap['acessorios'], brandId: brandMap['nero-basics'], gender: 'unisex', status: 'active',
					freeShipping: false, soldCount: 321, ratingAvg: '4.50', ratingCount: 115,
					price: p(89.9), compareAtPrice: p(109.9), stock: 120, skuCode: 'BN-DAD-UNI',
				},
			])
			.returning();
		const [camOversized, camBasic, camCropped, calcaCargo, calcaChino, tenisRunner, tenisCasual, jaquetaBomber, jaquetaCorta, bone] = insertedProducts;
		console.log(`✅ ${insertedProducts.length} produtos inseridos.\n`);

		// ── Variation Types + Options + SKUs ───────────────────
		console.log('🎨 Inserindo variações e SKUs...');
		let totalSkus = 0;

		// Camiseta Oversized: Cor (com imagem) × Tamanho
		const ovsSKUs = await createProductWithVariations(
			camOversized.id,
			[
				{ name: 'Cor', hasImage: true, options: [{ value: 'Preto' }, { value: 'Branco' }] },
				{ name: 'Tamanho', hasImage: false, options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }, { value: 'GG' }] },
			],
			[
				{ optionValues: ['Preto', 'P'], price: 129.9, stock: 52, skuCode: 'TS-OVS-P-BLK' },
				{ optionValues: ['Preto', 'M'], price: 129.9, stock: 78, skuCode: 'TS-OVS-M-BLK' },
				{ optionValues: ['Preto', 'G'], price: 129.9, stock: 63, skuCode: 'TS-OVS-G-BLK' },
				{ optionValues: ['Preto', 'GG'], price: 139.9, stock: 30, skuCode: 'TS-OVS-GG-BLK' },
				{ optionValues: ['Branco', 'P'], price: 129.9, stock: 45, skuCode: 'TS-OVS-P-WHT' },
				{ optionValues: ['Branco', 'M'], price: 129.9, stock: 60, skuCode: 'TS-OVS-M-WHT' },
			],
		);
		totalSkus += ovsSKUs.length;

		// Camiseta Basic: Tamanho
		const bscSKUs = await createProductWithVariations(
			camBasic.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }, { value: 'GG' }] }],
			[
				{ optionValues: ['P'], price: 89.9, stock: 80, skuCode: 'TS-BSC-P' },
				{ optionValues: ['M'], price: 89.9, stock: 95, skuCode: 'TS-BSC-M' },
				{ optionValues: ['G'], price: 89.9, stock: 70, skuCode: 'TS-BSC-G' },
				{ optionValues: ['GG'], price: 99.9, stock: 40, skuCode: 'TS-BSC-GG' },
			],
		);
		totalSkus += bscSKUs.length;

		// Camiseta Cropped: Tamanho
		await createProductWithVariations(
			camCropped.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: 'PP' }, { value: 'P' }, { value: 'M' }] }],
			[
				{ optionValues: ['PP'], price: 79.9, stock: 35, skuCode: 'TS-CRP-PP' },
				{ optionValues: ['P'], price: 79.9, stock: 50, skuCode: 'TS-CRP-P' },
				{ optionValues: ['M'], price: 79.9, stock: 55, skuCode: 'TS-CRP-M' },
			],
		);
		totalSkus += 3;

		// Calça Cargo: Tamanho (numeração)
		const cargoSKUs = await createProductWithVariations(
			calcaCargo.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: '38' }, { value: '40' }, { value: '42' }, { value: '44' }] }],
			[
				{ optionValues: ['38'], price: 249.9, stock: 25, skuCode: 'CC-UTIL-38' },
				{ optionValues: ['40'], price: 249.9, stock: 34, skuCode: 'CC-UTIL-40' },
				{ optionValues: ['42'], price: 249.9, stock: 41, skuCode: 'CC-UTIL-42' },
				{ optionValues: ['44'], price: 249.9, stock: 18, skuCode: 'CC-UTIL-44' },
			],
		);
		totalSkus += cargoSKUs.length;

		// Calça Chino: Tamanho
		await createProductWithVariations(
			calcaChino.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: '38' }, { value: '40' }, { value: '42' }] }],
			[
				{ optionValues: ['38'], price: 199.9, stock: 30, skuCode: 'CH-SLM-38' },
				{ optionValues: ['40'], price: 199.9, stock: 45, skuCode: 'CH-SLM-40' },
				{ optionValues: ['42'], price: 199.9, stock: 38, skuCode: 'CH-SLM-42' },
			],
		);
		totalSkus += 3;

		// Tênis Runner: Tamanho
		const runnerSKUs = await createProductWithVariations(
			tenisRunner.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: '38' }, { value: '39' }, { value: '40' }, { value: '41' }, { value: '42' }] }],
			[
				{ optionValues: ['38'], price: 399.9, stock: 20, skuCode: 'TN-RUN-38' },
				{ optionValues: ['39'], price: 399.9, stock: 28, skuCode: 'TN-RUN-39' },
				{ optionValues: ['40'], price: 399.9, stock: 32, skuCode: 'TN-RUN-40' },
				{ optionValues: ['41'], price: 399.9, stock: 27, skuCode: 'TN-RUN-41' },
				{ optionValues: ['42'], price: 399.9, stock: 22, skuCode: 'TN-RUN-42' },
			],
		);
		totalSkus += runnerSKUs.length;

		// Tênis Casual: Tamanho
		await createProductWithVariations(
			tenisCasual.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: '39' }, { value: '40' }, { value: '41' }] }],
			[
				{ optionValues: ['39'], price: 289.9, stock: 15, skuCode: 'TN-CSL-39' },
				{ optionValues: ['40'], price: 289.9, stock: 22, skuCode: 'TN-CSL-40' },
				{ optionValues: ['41'], price: 289.9, stock: 18, skuCode: 'TN-CSL-41' },
			],
		);
		totalSkus += 3;

		// Jaqueta Bomber: Tamanho
		const bomberSKUs = await createProductWithVariations(
			jaquetaBomber.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }] }],
			[
				{ optionValues: ['P'], price: 459.9, stock: 15, skuCode: 'JK-BMB-P' },
				{ optionValues: ['M'], price: 459.9, stock: 20, skuCode: 'JK-BMB-M' },
				{ optionValues: ['G'], price: 459.9, stock: 12, skuCode: 'JK-BMB-G' },
			],
		);
		totalSkus += bomberSKUs.length;

		// Jaqueta Corta-Vento: Tamanho
		await createProductWithVariations(
			jaquetaCorta.id,
			[{ name: 'Tamanho', hasImage: false, options: [{ value: 'P' }, { value: 'M' }, { value: 'G' }] }],
			[
				{ optionValues: ['P'], price: 319.9, stock: 10, skuCode: 'JK-CTV-P' },
				{ optionValues: ['M'], price: 319.9, stock: 14, skuCode: 'JK-CTV-M' },
				{ optionValues: ['G'], price: 319.9, stock: 8, skuCode: 'JK-CTV-G' },
			],
		);
		totalSkus += 3;

		console.log(`✅ ${totalSkus} SKUs + variações inseridos.\n`);

		// ── Images ────────────────────────────────────────────
		console.log('🖼️  Inserindo imagens...');
		await db.insert(productImages).values([
			{ productId: camOversized.id, url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop', altText: 'Camiseta oversized preta', position: 1, isPrimary: true },
			{ productId: camOversized.id, url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&h=800&fit=crop', altText: 'Camiseta oversized detalhe', position: 2, isPrimary: false },
			{ productId: camBasic.id, url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=800&fit=crop', altText: 'Camiseta basic cinza', position: 1, isPrimary: true },
			{ productId: camCropped.id, url: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&h=800&fit=crop', altText: 'Camiseta cropped rosa', position: 1, isPrimary: true },
			{ productId: calcaCargo.id, url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&h=800&fit=crop', altText: 'Calça cargo verde militar', position: 1, isPrimary: true },
			{ productId: calcaCargo.id, url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&h=800&fit=crop', altText: 'Calça cargo detalhe bolso', position: 2, isPrimary: false },
			{ productId: calcaChino.id, url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop', altText: 'Calça chino areia', position: 1, isPrimary: true },
			{ productId: tenisRunner.id, url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop', altText: 'Tênis runner preto', position: 1, isPrimary: true },
			{ productId: tenisRunner.id, url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop', altText: 'Tênis runner lateral', position: 2, isPrimary: false },
			{ productId: tenisCasual.id, url: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&h=800&fit=crop', altText: 'Tênis casual branco', position: 1, isPrimary: true },
			{ productId: jaquetaBomber.id, url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&h=800&fit=crop', altText: 'Jaqueta bomber preta', position: 1, isPrimary: true },
			{ productId: jaquetaBomber.id, url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&h=800&fit=crop', altText: 'Jaqueta bomber costas', position: 2, isPrimary: false },
			{ productId: jaquetaCorta.id, url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&h=800&fit=crop', altText: 'Jaqueta corta-vento azul', position: 1, isPrimary: true },
			{ productId: bone.id, url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&h=800&fit=crop', altText: 'Boné dad hat preto', position: 1, isPrimary: true },
		]);
		console.log('✅ Imagens inseridas.\n');

		// ── Home Sections ─────────────────────────────────────
		console.log('🏠 Inserindo seções da home...');
		await db.insert(homeSections).values([
			{ slug: 'top-selling', title: 'Mais Vendidos', type: 'top_selling', sortOrder: 1, isActive: true, filterJson: { limit: 10 } },
			{ slug: 'new-in', title: 'Novidades', type: 'new_in', sortOrder: 2, isActive: true, filterJson: { limit: 8, daysAgo: 30 } },
			{ slug: 'on-sale', title: 'Promoções', type: 'on_sale', sortOrder: 3, isActive: true, filterJson: { limit: 8 } },
			{ slug: 'free-shipping', title: 'Frete Grátis', type: 'free_shipping', sortOrder: 4, isActive: true, filterJson: { limit: 6 } },
			{ slug: 'para-ele', title: 'Para Ele', type: 'by_gender', sortOrder: 5, isActive: true, filterJson: { gender: 'men', limit: 8 } },
			{ slug: 'para-ela', title: 'Para Ela', type: 'by_gender', sortOrder: 6, isActive: true, filterJson: { gender: 'women', limit: 8 } },
		] as (typeof homeSections.$inferInsert)[]);
		console.log('✅ Seções da home inseridas.\n');

		// ── Reviews ───────────────────────────────────────────
		console.log('⭐ Inserindo reviews...');
		await db.insert(productReviews).values([
			{ productId: camOversized.id, userId: ana.id, rating: 5, title: 'Perfeita!', comment: 'Super confortável, caimento incrível. Recomendo muito!', isVerifiedPurchase: true, status: 'approved' },
			{ productId: camOversized.id, userId: joao.id, rating: 4, title: 'Muito boa', comment: 'Ótima qualidade, só achei o tamanho um pouco grande.', isVerifiedPurchase: true, status: 'approved' },
			{ productId: camBasic.id, userId: joao.id, rating: 4, title: 'Boa compra', comment: 'Camiseta simples e de qualidade. Uso no dia a dia.', isVerifiedPurchase: false, status: 'approved' },
			{ productId: calcaCargo.id, userId: ana.id, rating: 5, title: 'Excelente!', comment: 'Calça muito estilosa e com bastante espaço nos bolsos.', isVerifiedPurchase: true, status: 'approved' },
			{ productId: calcaCargo.id, userId: joao.id, rating: 5, title: 'Top demais', comment: 'Material resistente e caimento perfeito.', isVerifiedPurchase: true, status: 'approved' },
			{ productId: tenisRunner.id, userId: ana.id, rating: 5, title: 'Melhor tênis!', comment: 'Amortecimento incrível, uso para corridas diárias.', isVerifiedPurchase: true, status: 'approved' },
			{ productId: tenisRunner.id, userId: joao.id, rating: 5, title: 'Vale cada centavo', comment: 'Qualidade surpreendente pelo preço. Super recomendo.', isVerifiedPurchase: true, status: 'approved' },
			{ productId: jaquetaBomber.id, userId: joao.id, rating: 5, title: 'Jaqueta incrível', comment: 'Forro excelente, design atemporal. Ja comprei duas!', isVerifiedPurchase: true, status: 'approved' },
			{ productId: tenisCasual.id, userId: ana.id, rating: 4, title: 'Lindo!', comment: 'Design minimalista que combina com tudo.', isVerifiedPurchase: false, status: 'approved' },
			{ productId: bone.id, userId: ana.id, rating: 5, title: 'Adorei', comment: 'Qualidade ótima e ajuste perfeito.', isVerifiedPurchase: true, status: 'approved' },
		]);
		console.log('✅ Reviews inseridos.\n');

		// ── Wishlists ─────────────────────────────────────────
		console.log('❤️  Inserindo wishlists...');
		const insertedWishlists = await db.insert(wishlists).values([
			{ userId: ana.id, name: 'Meus Favoritos', isDefault: true },
			{ userId: ana.id, name: 'Presente', isDefault: false },
			{ userId: joao.id, name: 'Meus Favoritos', isDefault: true },
		]).returning();
		const [anaDefault, anaPresente, joaoDefault] = insertedWishlists;
		await db.insert(wishlistItems).values([
			{ wishlistId: anaDefault.id, productId: camOversized.id },
			{ wishlistId: anaDefault.id, productId: tenisRunner.id },
			{ wishlistId: anaDefault.id, productId: jaquetaBomber.id },
			{ wishlistId: anaPresente.id, productId: bone.id },
			{ wishlistId: anaPresente.id, productId: tenisCasual.id },
			{ wishlistId: joaoDefault.id, productId: calcaCargo.id },
			{ wishlistId: joaoDefault.id, productId: jaquetaBomber.id },
		]).onConflictDoNothing();
		console.log('✅ Wishlists inseridas.\n');

		// ── Carts (using SKU IDs) ─────────────────────────────
		console.log('🛒 Inserindo carrinhos...');
		const skuByCode = Object.fromEntries(
			[...ovsSKUs, ...bscSKUs, ...cargoSKUs, ...runnerSKUs, ...bomberSKUs].map((s) => [s.skuCode, s]),
		);

		const insertedCarts = await db.insert(carts).values([
			{
				userId: ana.id,
				subtotal: String(p(129.9) + p(399.9)),
				shippingCost: '800', taxAmount: '0',
				total: String(p(129.9) + p(399.9) + 800),
			},
			{
				userId: joao.id,
				subtotal: String(p(249.9) + p(459.9)),
				shippingCost: '800', taxAmount: '0',
				total: String(p(249.9) + p(459.9) + 800),
			},
		]).returning();
		const [anaCart, joaoCart] = insertedCarts;

		await db.insert(cartItems).values([
			{ cartId: anaCart.id, productId: camOversized.id, skuId: skuByCode['TS-OVS-M-BLK'].id, quantity: 1, priceSnapshot: String(p(129.9)) },
			{ cartId: anaCart.id, productId: tenisRunner.id, skuId: skuByCode['TN-RUN-41'].id, quantity: 1, priceSnapshot: String(p(399.9)) },
			{ cartId: joaoCart.id, productId: calcaCargo.id, skuId: skuByCode['CC-UTIL-40'].id, quantity: 1, priceSnapshot: String(p(249.9)) },
			{ cartId: joaoCart.id, productId: jaquetaBomber.id, skuId: skuByCode['JK-BMB-M'].id, quantity: 1, priceSnapshot: String(p(459.9)) },
		]);
		console.log('✅ Carrinhos inseridos.\n');

		// ── Summary ───────────────────────────────────────────
		console.log('═══════════════════════════════════════');
		console.log('✅ Seed concluído!\n');
		console.log(`   Marcas:      ${insertedBrands.length}`);
		console.log(`   Categorias:  ${insertedCategories.length}`);
		console.log(`   Produtos:    ${insertedProducts.length}`);
		console.log(`   SKUs:        ${totalSkus}`);
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
