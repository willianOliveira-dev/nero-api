import { and, asc, desc, eq, gt, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
	productImages,
	productSkus,
	products,
	skuOptionMap,
	variationOptions,
	variationTypes,
	wishlistItems,
	wishlists,
} from '@/lib/db/schemas/index.schema';
import { Price } from '@/shared/utils/price.util';
import type {
	ConfirmProductImageInput,
	CreateProductInput,
	SearchProductsInput,
	UpdateProductImageInput,
	UpdateProductInput,
	UpdateSkuInput,
} from '../validations/products.validation';

export class ProductsRepository {

	async findById(id: string) {
		return (
			db.query.products.findFirst({
				where: eq(products.id, id),
				with: {
					brand: {
						columns: {
							id: true,
							name: true,
							slug: true,
							logoUrl: true,
						},
					},
					category: {
						columns: {
							id: true,
							name: true,
							slug: true,
							parentId: true,
						},
					},
					variationTypes: {
						orderBy: asc(variationTypes.position),
						with: {
							options: {
								orderBy: asc(variationOptions.position),
							},
						},
					},
					skus: {
						orderBy: asc(productSkus.skuCode),
						with: {
							optionMappings: {
								with: {
									variationOption: {
										with: {
											variationType: {
												columns: { id: true, name: true },
											},
										},
									},
								},
							},
						},
					},
					images: { orderBy: asc(productImages.position) },
				},
			}) ?? null
		);
	}

	async findBySlug(slug: string, userId?: string) {
		const product = await db.query.products.findFirst({
			where: and(eq(products.slug, slug), eq(products.status, 'active')),
			with: {
				brand: {
					columns: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
					},
				},
				category: {
					columns: {
						id: true,
						name: true,
						slug: true,
						parentId: true,
					},
					with: {
						parent: {
							columns: { id: true, name: true, slug: true },
						},
					},
				},
				variationTypes: {
					orderBy: asc(variationTypes.position),
					with: {
						options: {
							orderBy: asc(variationOptions.position),
						},
					},
				},
				skus: {
					orderBy: asc(productSkus.skuCode),
					with: {
						optionMappings: {
							with: {
								variationOption: {
									with: {
										variationType: {
											columns: { id: true, name: true },
										},
									},
								},
							},
						},
					},
				},
				images: { orderBy: asc(productImages.position) },
			},
		});

		if (!product) {
			return null;
		}

		let isWishlisted = false;
		if (userId) {
			const wishlist = await db.query.wishlists.findFirst({
				where: eq(wishlists.userId, userId),
				with: {
					items: {
						where: eq(wishlistItems.productId, product.id),
						limit: 1,
					},
				},
			});
			isWishlisted = (wishlist?.items?.length ?? 0) > 0;
		}

		return { ...product, isWishlisted };
	}

	async search(filters: SearchProductsInput) {
		const {
			q,
			gender,
			sort,
			deals,
			priceMin,
			priceMax,
			categoryId,
			limit,
			cursor,
		} = filters;

		const conditions = [eq(products.status, 'active')];

		if (gender) {
			conditions.push(eq(products.gender, gender));
		}
		if (categoryId) {
			conditions.push(eq(products.categoryId, categoryId));
		}
		if (priceMin) {
			conditions.push(gt(products.price, Price.toInt(priceMin)));
		}
		if (priceMax) {
			conditions.push(lt(products.price, Price.toInt(priceMax)));
		}

		if (deals === 'on_sale') {
			conditions.push(isNotNull(products.compareAtPrice));
		}
		if (deals === 'free_shipping') {
			conditions.push(eq(products.freeShipping, true));
		}

		if (q) {
			conditions.push(
				sql`${products.searchVector} @@ plainto_tsquery('portuguese', ${q})`,
			);
		}

		if (cursor) {
			conditions.push(gt(products.id, cursor));
		}

		const orderBy = {
			recommended: [desc(products.ratingAvg), desc(products.soldCount)],
			newest: [desc(products.createdAt)],
			price_asc: [asc(products.price)],
			price_desc: [desc(products.price)],
		}[sort] ?? [desc(products.createdAt)];

		const rows = await db.query.products.findMany({
			where: and(...conditions),
			orderBy,
			limit: limit + 1,
			with: {
				brand: {
					columns: {
						id: true,
						name: true,
						slug: true,
						logoUrl: true,
					},
				},
				images: {
					where: eq(productImages.isPrimary, true),
					limit: 1,
				},
				skus: {
					where: eq(productSkus.isActive, true),
					columns: { price: true, isActive: true },
				},
			},
		});

		const hasMore = rows.length > limit;
		const data = hasMore ? rows.slice(0, limit) : rows;
		const nextCursor = hasMore ? data[data.length - 1].id : null;

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)::int` })
			.from(products)
			.where(and(...conditions));

		return { data, total, nextCursor, hasMore };
	}


	async create(input: CreateProductInput) {
		const { variationTypes: vtInput, skus: skusInput, ...productData } = input;
		const hasVariations = !!(vtInput && vtInput.length > 0);

		return db.transaction(async (tx) => {
			const [product] = await tx
				.insert(products)
				.values({
					...productData,
					hasVariations,
					price: hasVariations ? null : Price.toInt(productData.price ?? null),
					compareAtPrice: hasVariations
						? null
						: Price.toInt(productData.compareAtPrice ?? null),
					stock: hasVariations ? null : productData.stock ?? null,
				})
				.returning();

			if (hasVariations && vtInput && skusInput) {
			
				const optionIdMap = new Map<string, string>();

				for (let vtPos = 0; vtPos < vtInput.length; vtPos++) {
					const vtData = vtInput[vtPos];
					const [vType] = await tx
						.insert(variationTypes)
						.values({
							productId: product.id,
							name: vtData.name,
							position: vtPos + 1,
							hasImage: vtPos === 0, //! Somente position=1 pode ter hasImage
						})
						.returning();

					for (let optPos = 0; optPos < vtData.options.length; optPos++) {
						const optData = vtData.options[optPos];
						const [option] = await tx
							.insert(variationOptions)
							.values({
								variationTypeId: vType.id,
								value: optData.value,
								imageUrl: vtPos === 0 ? optData.imageUrl ?? null : null,
								position: optPos + 1,
							})
							.returning();

						optionIdMap.set(`${vtData.name}:${optData.value}`, option.id);
					}
				}

		
				for (const skuData of skusInput) {
					const [sku] = await tx
						.insert(productSkus)
						.values({
							productId: product.id,
							price: Price.toInt(skuData.price),
							compareAtPrice: Price.toInt(skuData.compareAtPrice ?? null),
							stock: skuData.stock,
							skuCode: skuData.skuCode,
							ean: skuData.ean ?? null,
						})
						.returning();

		
					for (let i = 0; i < skuData.optionValues.length; i++) {
						const typeName = vtInput[i].name;
						const optionValue = skuData.optionValues[i];
						const optionId = optionIdMap.get(`${typeName}:${optionValue}`);

						if (!optionId) {
							throw new Error(
								`Opção "${optionValue}" não encontrada para variação "${typeName}"`,
							);
						}

						await tx.insert(skuOptionMap).values({
							skuId: sku.id,
							variationOptionId: optionId,
						});
					}
				}
			}

			return product;
		});
	}

	async update(id: string, input: UpdateProductInput) {
		const {
			price,
			compareAtPrice,
			variationTypes: _vt,
			skus: _skus,
			...rest
		} = input;

		const [result] = await db
			.update(products)
			.set({
				...rest,
				...(price !== undefined && {
					price: price === null ? null : Price.toInt(price),
				}),
				...(compareAtPrice !== undefined && {
					compareAtPrice:
						compareAtPrice === null
							? null
							: Price.toInt(compareAtPrice),
				}),
				updatedAt: new Date(),
			})
			.where(eq(products.id, id))
			.returning();

		return result ?? null;
	}

	async archive(id: string) {
		const [result] = await db
			.update(products)
			.set({ status: 'archived', updatedAt: new Date() })
			.where(eq(products.id, id))
			.returning();

		return result ?? null;
	}


	async findSkuById(id: string) {
		return (
			db.query.productSkus.findFirst({
				where: eq(productSkus.id, id),
				with: {
					optionMappings: {
						with: {
							variationOption: {
								with: {
									variationType: {
										columns: { id: true, name: true },
									},
								},
							},
						},
					},
				},
			}) ?? null
		);
	}

	async updateSku(id: string, input: UpdateSkuInput) {
		const { price, compareAtPrice, ...rest } = input;

		const [result] = await db
			.update(productSkus)
			.set({
				...rest,
				...(price !== undefined && {
					price: Price.toInt(price),
				}),
				...(compareAtPrice !== undefined && {
					compareAtPrice:
						compareAtPrice === null
							? null
							: Price.toInt(compareAtPrice),
				}),
			})
			.where(eq(productSkus.id, id))
			.returning();

		return result ?? null;
	}



	async findImagesByProductId(productId: string) {
		return db.query.productImages.findMany({
			where: eq(productImages.productId, productId),
			orderBy: asc(productImages.position),
		});
	}

	async countImagesByProductId(productId: string) {
		const result = await db.query.productImages.findMany({
			where: eq(productImages.productId, productId),
			columns: { id: true },
		});
		return result.length;
	}

	async createImage(productId: string, input: ConfirmProductImageInput) {
		if (input.isPrimary) {
			await db
				.update(productImages)
				.set({ isPrimary: false })
				.where(eq(productImages.productId, productId));
		}

		const [result] = await db
			.insert(productImages)
			.values({ ...input, productId })
			.returning();

		return result;
	}

	async updateImage(id: string, input: UpdateProductImageInput) {
		const [result] = await db
			.update(productImages)
			.set(input)
			.where(eq(productImages.id, id))
			.returning();

		return result ?? null;
	}

	async deleteImage(id: string) {
		const [result] = await db
			.delete(productImages)
			.where(eq(productImages.id, id))
			.returning();

		return result ?? null;
	}

	async reorderImages(items: { id: string; position: number }[]) {
		await db.transaction(async (tx) => {
			for (const item of items) {
				await tx
					.update(productImages)
					.set({ position: item.position })
					.where(eq(productImages.id, item.id));
			}
		});
	}
}
