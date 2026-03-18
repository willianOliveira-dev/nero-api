/**
 * products.serializer.ts
 * ─────────────────────────────────────────────────────────────
 * Serializa os dados brutos do banco para o payload da API.
 *
 * Campos NUNCA aceitos do cliente (sempre computados):
 *   - hasVariations
 *   - pricing.*
 *   - sku.isOutOfStock
 *   - simpleProduct.isOutOfStock
 *   - rating.average
 * ─────────────────────────────────────────────────────────────
 */

import { Price, type PriceOutput, type ProductPriceOutput } from '@/shared/utils/price.util';

// ── Raw Types (from DB joins) ─────────────────────────────────

export type RawBrand = {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
};

export type RawCategory = {
	id: string;
	name: string;
	slug: string;
	parentId: string | null;
	parent?: { id: string; name: string; slug: string } | null;
};

export type RawImage = {
	id: string;
	url: string;
	altText: string | null;
	position: number;
	isPrimary: boolean;
};

export type RawVariationOption = {
	id: string;
	variationTypeId: string;
	value: string;
	imageUrl: string | null;
	position: number;
};

export type RawVariationType = {
	id: string;
	name: string;
	position: number;
	hasImage: boolean;
	options: RawVariationOption[];
};

export type RawSkuOptionMap = {
	variationOptionId: string;
	variationOption: RawVariationOption & {
		variationType: { id: string; name: string };
	};
};

export type RawSku = {
	id: string;
	price: number;
	compareAtPrice: number | null;
	stock: number;
	skuCode: string;
	ean: string | null;
	isActive: boolean;
	optionMappings: RawSkuOptionMap[];
};

export type RawProduct = {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	price: number | null;
	compareAtPrice: number | null;
	stock: number | null;
	skuCode: string | null;
	ean: string | null;
	gender: string;
	status: string;
	freeShipping: boolean;
	hasVariations: boolean;
	soldCount: number;
	ratingAvg: string | null;
	ratingCount: number;
	sizeChartUrl: string | null;
	thumbnailUrl: string | null;
	categoryId: string | null;
	brandId: string | null;
	createdAt: Date;
	updatedAt: Date;
	brand?: RawBrand | null;
	category?: RawCategory | null;
	variationTypes?: RawVariationType[];
	skus?: RawSku[];
	images?: RawImage[];
};

// ── Computed Types (output) ───────────────────────────────────

type PricingOutput = {
	displayPriceMin: PriceOutput;
	displayPriceMax: PriceOutput;
	priceRange: string;
	hasPriceVariation: boolean;
};

type SimpleProductOutput = {
	price: ProductPriceOutput;
	stock: number;
	skuCode: string;
	ean: string | null;
	isOutOfStock: boolean;
};

type VariationOptionOutput = {
	id: string;
	value: string;
	imageUrl: string | null;
	position: number;
};

type VariationTypeOutput = {
	id: string;
	name: string;
	position: number;
	hasImage: boolean;
	options: VariationOptionOutput[];
};

type SkuOutput = {
	id: string;
	optionIds: string[];
	optionLabels: Record<string, string>;
	price: PriceOutput;
	compareAtPrice: PriceOutput | null;
	discountPercent: number | null;
	stock: number;
	skuCode: string;
	ean: string | null;
	isOutOfStock: boolean;
	isActive: boolean;
};

type CartRulesOutput = {
	maxQuantityPerSku: string;
	outOfStockBehavior: string;
};


export type RawProductCardInput = Omit<RawProduct, 'skus'> & {
	skus?: Pick<RawSku, 'price' | 'isActive'>[];
};


export function serializeProductCard(product: RawProductCardInput) {
	const pricing = product.hasVariations && product.skus?.length
		? computePricing(product.skus)
		: null;

	const thumbnailUrl =
		product.thumbnailUrl ??
		product.images?.find((i) => i.isPrimary)?.url ??
		product.images?.[0]?.url ??
		null;

	return {
		id: product.id,
		name: product.name,
		slug: product.slug,
		status: product.status,
		thumbnailUrl,
		hasVariations: product.hasVariations,
		pricing: pricing
			? {
				displayPriceMin: pricing.displayPriceMin,
				priceRange: pricing.priceRange,
				hasPriceVariation: pricing.hasPriceVariation,
			}
			: product.price
				? {
					displayPriceMin: Price.toOutput(product.price),
					priceRange: Price.format(product.price) as string,
					hasPriceVariation: false,
				}
				: null,
		brand: product.brand
			? { name: product.brand.name, slug: product.brand.slug }
			: null,
		rating: {
			average: product.ratingAvg ? Number(product.ratingAvg) : 0,
			count: product.ratingCount,
			sold: product.soldCount,
		},
		freeShipping: product.freeShipping,
	};
}

export function serializeProductList(products: RawProductCardInput[]) {
	return products.map(serializeProductCard);
}


export function serializeProductDetail(
	product: RawProduct,
	isWishlisted = false,
) {
	const images = [...(product.images ?? [])].sort(
		(a, b) => a.position - b.position,
	);

	const categories = [];
	if (product.category?.parent) {
		categories.push({
			name: product.category.parent.name,
			slug: product.category.parent.slug,
		});
	}
	if (product.category) {
		categories.push({
			name: product.category.name,
			slug: product.category.slug,
		});
	}

	//  Compute variations output
	const variationTypes: VariationTypeOutput[] | null =
		product.hasVariations && product.variationTypes?.length
			? product.variationTypes
				.sort((a, b) => a.position - b.position)
				.map((vt) => ({
					id: vt.id,
					name: vt.name,
					position: vt.position,
					hasImage: vt.hasImage,
					options: vt.options
						.sort((a, b) => a.position - b.position)
						.map((opt) => ({
							id: opt.id,
							value: opt.value,
							imageUrl: opt.imageUrl,
							position: opt.position,
						})),
				}))
			: null;

	//  Compute SKUs output
	const skus: SkuOutput[] | null =
		product.hasVariations && product.skus?.length
			? product.skus.map((sku) => serializeSku(sku))
			: null;

	//  Compute pricing (NUNCA salvo no banco)
	const pricing: PricingOutput | null =
		product.hasVariations && product.skus?.length
			? computePricing(product.skus)
			: null;

	//  Simple product (sem variações)
	const simpleProduct: SimpleProductOutput | null =
		!product.hasVariations && product.price != null
			? {
				price: Price.toProductOutput(product.price, product.compareAtPrice),
				stock: product.stock ?? 0,
				skuCode: product.skuCode ?? '',
				ean: product.ean ?? null,
				isOutOfStock: (product.stock ?? 0) <= 0,
			}
			: null;

	return {
		id: product.id,
		name: product.name,
		slug: product.slug,
		description: product.description,
		status: product.status,
		thumbnailUrl:
			product.thumbnailUrl ??
			images.find((i) => i.isPrimary)?.url ??
			images[0]?.url ??
			null,
		hasVariations: product.hasVariations,
		simpleProduct,
		pricing,
		variationTypes,
		skus,
		cartRules: {
			maxQuantityPerSku: 'stock',
			outOfStockBehavior: 'disable_option',
		} as CartRulesOutput,
		brand: product.brand
			? {
				name: product.brand.name,
				slug: product.brand.slug,
				logo: product.brand.logoUrl,
			}
			: null,
		categories,
		images: images.map((img) => ({
			id: img.id,
			url: img.url,
			alt: img.altText,
			isPrimary: img.isPrimary,
		})),
		rating: {
			average: product.ratingAvg ? Number(product.ratingAvg) : 0,
			count: product.ratingCount,
			sold: product.soldCount,
		},
		features: {
			freeShipping: product.freeShipping,
			gender: product.gender,
			sizeChart: product.sizeChartUrl,
		},
		userContext: {
			isWishlisted,
		},
	};
}


function serializeSku(sku: RawSku): SkuOutput {
	const optionIds: string[] = [];
	const optionLabels: Record<string, string> = {};

	for (const mapping of sku.optionMappings) {
		optionIds.push(mapping.variationOptionId);
		optionLabels[mapping.variationOption.variationType.name] =
			mapping.variationOption.value;
	}

	const currentPrice = Price.toOutput(sku.price);
	const compareAtPrice = sku.compareAtPrice
		? Price.toOutput(sku.compareAtPrice)
		: null;

	const discountPercent =
		sku.compareAtPrice && sku.compareAtPrice > sku.price
			? Math.round(
				((sku.compareAtPrice - sku.price) / sku.compareAtPrice) * 100,
			)
			: null;

	return {
		id: sku.id,
		optionIds,
		optionLabels,
		price: currentPrice,
		compareAtPrice,
		discountPercent,
		stock: sku.stock,
		skuCode: sku.skuCode,
		ean: sku.ean,
		isOutOfStock: sku.stock <= 0,
		isActive: sku.isActive,
	};
}

function computePricing(skus: Pick<RawSku, 'price' | 'isActive'>[]): PricingOutput {
	const activeSkus = skus.filter((s) => s.isActive);
	const prices = activeSkus.map((s) => s.price);

	if (prices.length === 0) {
		const fallback = Price.toOutput(0);
		return {
			displayPriceMin: fallback,
			displayPriceMax: fallback,
			priceRange: Price.format(0) as string,
			hasPriceVariation: false,
		};
	}

	const min = Math.min(...prices);
	const max = Math.max(...prices);
	const hasPriceVariation = min !== max;

	return {
		displayPriceMin: Price.toOutput(min),
		displayPriceMax: Price.toOutput(max),
		priceRange: hasPriceVariation
			? `${Price.format(min)} - ${Price.format(max)}`
			: (Price.format(min) as string),
		hasPriceVariation,
	};
}
