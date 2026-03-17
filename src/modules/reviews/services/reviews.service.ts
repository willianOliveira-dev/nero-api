import { StorageService } from '@/modules/storage/services/storage.service';
import { NotFoundError } from '@/shared/errors/app.error';
import { ReviewsRepository } from '../repositories/reviews.repository';
import { serializeReviewList } from '../serializers/reviews.serializer';
import type { CreateReviewInput, ListReviewsQuery } from '../validations/reviews.validation';

const reviewsRepository = new ReviewsRepository();
const storageService = new StorageService();

export class ReviewsService {
    async list(query: ListReviewsQuery, userId?: string) {
        const { productId, limit, cursor } = query;
        const result = await reviewsRepository.findByProductId(productId, limit, cursor, userId);
        return {
            items: serializeReviewList(result.data as any, result.userLikedIds),
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
        };
    }

    async create(userId: string, input: CreateReviewInput) {
        const review = await reviewsRepository.create(userId, input);
        return review;
    }

    async toggleLike(reviewId: string, userId: string) {
        const review = await reviewsRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundError('Avaliação não encontrada.');
        }
        return await reviewsRepository.toggleLike(reviewId, userId);
    }

    async presignMedia(userId: string) {
        return storageService.generateUploadSignature(
            'reviews',
            `review_${userId}_${Date.now()}`,
        );
    }
}
