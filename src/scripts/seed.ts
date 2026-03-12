import { db } from '../lib/db/connection';
import { auth } from '../lib/auth/auth.lib';
import * as schema from '../lib/db/schemas/index.schema';

async function seed() {
    console.log('🌱 Iniciando o seed do banco de dados...');

    try {
        // 1. Criar Usuário Admin via Better Auth
        const email = `admin${Math.floor(Math.random() * 10000)}@nero.com`;
        const password = 'Password123!';
        
        console.log(`👤 Criando usuário: ${email}`);
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: 'Admin Nero',
            }
        });
        console.log('✅ Usuário admin criado com sucesso!');

        // 2. Categorias
        console.log('📁 Populando categorias...');
        const categories = await db.insert(schema.categories).values([
            { name: 'Camisetas', slug: 'camisetas', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png', sortOrder: 1 },
            { name: 'Calças', slug: 'calcas', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png', sortOrder: 2 },
            { name: 'Casacos', slug: 'casacos', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png', sortOrder: 3 },
            { name: 'Calçados', slug: 'calcados', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png', sortOrder: 4 },
            { name: 'Acessórios', slug: 'acessorios', iconUrl: 'https://cdn-icons-png.flaticon.com/512/2503/2503380.png', sortOrder: 5 },
        ]).returning();

        const catIds = {
            camisetas: categories.find(c => c.slug === 'camisetas')!.id,
            calcas: categories.find(c => c.slug === 'calcas')!.id,
            casacos: categories.find(c => c.slug === 'casacos')!.id,
            calcados: categories.find(c => c.slug === 'calcados')!.id,
            acessorios: categories.find(c => c.slug === 'acessorios')!.id,
        };

        // 3. Produtos
        console.log('👕 Populando produtos...');
        const productsData = [
            { 
                name: 'Camiseta Oversized Premium', 
                slug: 'camiseta-oversized-premium', 
                description: 'Camiseta 100% algodão egípcio com corte oversized moderno.',
                basePrice: '129.90',
                categoryId: catIds.camisetas,
                gender: 'unisex' as const,
                status: 'active' as const,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=1000&auto=format&fit=crop'
                ]
            },
            { 
                name: 'Calça Jeans Slim Fit Dark', 
                slug: 'calca-jeans-slim-fit-dark', 
                description: 'Jeans com elastano para máximo conforto e durabilidade.',
                basePrice: '249.90',
                originalPrice: '299.90',
                categoryId: catIds.calcas,
                gender: 'men' as const,
                status: 'active' as const,
                images: [
                    'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=1000&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
                ]
            },
            { 
                name: 'Jaqueta Puffer Ártico', 
                slug: 'jaqueta-puffer-artico', 
                description: 'Proteção térmica extrema com design urbano sofisticado.',
                basePrice: '459.00',
                categoryId: catIds.casacos,
                gender: 'women' as const,
                status: 'active' as const,
                isFeatured: true,
                images: [
                    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1544923246-77307dd654ca?q=80&w=1000&auto=format&fit=crop'
                ]
            },
            { 
                name: 'Tênis Urban Retro v1', 
                slug: 'tenis-urban-retro-v1', 
                description: 'Inspirado nos clássicos dos anos 90, reinventado para o dia a dia.',
                basePrice: '389.90',
                categoryId: catIds.calcados,
                gender: 'unisex' as const,
                status: 'active' as const,
                images: [
                    'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1000&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1525966222134-fcfa99b1ae77?q=80&w=1000&auto=format&fit=crop'
                ]
            },
            { 
                name: 'Bolsa Tote de Couro Vegan', 
                slug: 'bolsa-tote-couro-vegan', 
                description: 'Espaçosa e elegante, perfeita para o trabalho ou lazer.',
                basePrice: '199.00',
                categoryId: catIds.acessorios,
                gender: 'women' as const,
                status: 'active' as const,
                images: [
                    'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop',
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1000&auto=format&fit=crop'
                ]
            }
        ];

        for (const p of productsData) {
            const [insertedProduct] = await db.insert(schema.products).values({
                name: p.name,
                slug: p.slug,
                description: p.description,
                basePrice: p.basePrice,
                originalPrice: p.originalPrice,
                categoryId: p.categoryId,
                gender: p.gender,
                status: p.status,
                isFeatured: p.isFeatured,
            }).returning();

            console.log(`   ✨ Produto criado: ${p.name}`);

            // 4. Variantes
            const sizes = ['P', 'M', 'G', 'GG'];
            const colors = [
                { name: 'Preto', hex: '#000000' },
                { name: 'Branco', hex: '#FFFFFF' },
                { name: 'Off White', hex: '#FAF9F6' }
            ];

            for (const color of colors) {
                for (const size of sizes) {
                    const [variant] = await db.insert(schema.productVariants).values({
                        productId: insertedProduct.id,
                        sku: `${p.slug.toUpperCase()}-${size}-${color.name.toUpperCase()}`,
                        stock: Math.floor(Math.random() * 50) + 10,
                        attributes: {
                            size,
                            color: color.name,
                            hexColor: color.hex
                        }
                    }).returning();

                    // 5. Imagens (vincular à primeira variante de cada cor apenas para exemplo)
                    if (size === 'M') {
                        await db.insert(schema.productImages).values(
                            p.images.map((url, idx) => ({
                                productId: insertedProduct.id,
                                variantId: variant.id,
                                url,
                                altText: `${p.name} ${color.name}`,
                                position: idx + 1,
                                isPrimary: idx === 0
                            }))
                        );
                    }
                }
            }
        }

        console.log('\n🚀 Seed finalizado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro durante o seed:', error);
        process.exit(1);
    }
}

seed();
