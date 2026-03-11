import { env } from '@/config/env';
import { cloudinary } from '@/lib/storage/cloudinary.storage';

export class StorageService {
    /**
     * Gera assinatura para upload direto do cliente (mobile/web)
     * sem expor o API Secret no app.
     *
     * O SDK mobile usa esta assinatura para fazer upload direto
     * ao Cloudinary via FormData — sem passar o arquivo pelo servidor.
     *
     * @param folder    Pasta no Cloudinary: "avatars" | "products" | "categories"
     * @param publicId  ID público opcional (ex: publicId para sobrescrever avatar, products, categories...)
     */
    generateUploadSignature(folder: string, publicId?: string) {
        const timestamp = Math.round(Date.now() / 1000);

        const params: Record<string, string | number> = {
            timestamp,
            folder,
            ...(publicId && { public_id: publicId }),
        };

        const signature = cloudinary.utils.api_sign_request(
            params,
            env.CLOUDINARY_API_SECRET,
        );

        return {
            signature,
            timestamp,
            folder,
            publicId,
            cloudName: env.CLOUDINARY_CLOUD_NAME,
            apiKey: env.CLOUDINARY_API_KEY,
        };
    }

    /**
     * Upload server-side via buffer (imagens de produto no admin).
     * Aplica otimizações automáticas de qualidade e formato.
     *
     * @param buffer    Buffer do arquivo recebido no multipart
     * @param folder    Pasta no Cloudinary
     * @param publicId  ID público opcional para sobrescrever imagem existente
     */
    async uploadBuffer(
        buffer: Buffer,
        folder: string,
        publicId?: string,
    ): Promise<{ url: string; publicId: string }> {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    public_id: publicId,
                    resource_type: 'image',
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }, // webp/avif automático
                        { width: 1200, crop: 'limit' }, // limita largura máxima
                    ],
                },
                (error, result) => {
                    if (error || !result) {
                        return reject(error);
                    }
                    resolve({
                        url: result.secure_url,
                        publicId: result.public_id,
                    });
                },
            );

            stream.end(buffer);
        });
    }

    /**
     * Deleta uma imagem pelo publicId.
     * Chamado ao trocar avatar ou remover imagem de produto.
     *
     * @param publicId  Ex: "avatars/user_123" ou "products/nero_abc"
     */
    async deleteFile(publicId: string): Promise<void> {
        await cloudinary.uploader.destroy(publicId);
    }

    /**
     * Extrai o publicId a partir de uma URL do Cloudinary.
     * Ex: https://res.cloudinary.com/nero/image/upload/v123/avatars/user_1.jpg
     *     → avatars/user_1
     */
    extractPublicIdFromUrl(url: string): string | null {
        try {
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
            return match?.[1] ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Gera URL transformada on-the-fly pelo Cloudinary.
     * Útil para thumbnails sem fazer novo upload.
     *
     * Exemplos:
     *   // Thumbnail quadrado para card de produto
     *   getTransformedUrl("products/abc", { width: 400, height: 400, crop: "fill" })
     *
     *   // Avatar circular com detecção de rosto
     *   getTransformedUrl("avatars/user_1", { width: 80, height: 80, crop: "thumb", gravity: "face" })
     */
    getTransformedUrl(
        publicId: string,
        options: {
            width?: number;
            height?: number;
            crop?: string;
            gravity?: string;
            quality?: string | number;
            format?: string;
        } = {},
    ): string {
        return cloudinary.url(publicId, {
            secure: true,
            quality: options.quality ?? 'auto',
            fetch_format: options.format ?? 'auto',
            width: options.width,
            height: options.height,
            crop: options.crop,
            gravity: options.gravity,
        });
    }
}
