import { ReviewsService } from '../services/reviews.service';
import type {
    CreateReviewHandler,
    ListReviewsHandler,
    PresignReviewMediaHandler,
    ToggleLikeHandler,
} from '../../../types/handlers/reviews.handlers';

const reviewsService = new ReviewsService();

export const listReviewsHandler: ListReviewsHandler = async (request, reply) => {
    const userId = request.session?.user?.id;
    const result = await reviewsService.list(request.query, userId);
    return reply.status(200).send(result);
};

export const createReviewHandler: CreateReviewHandler = async (request, reply) => {
    const userId = request.session?.user?.id;
    if (!userId) {
        return reply.status(401).send({ message: 'Não autorizado.' });
    }
    const review = await reviewsService.create(userId, request.body);
    return reply.status(201).send(review);
};

export const toggleLikeHandler: ToggleLikeHandler = async (request, reply) => {
    const userId = request.session?.user?.id;
    if (!userId) {
        return reply.status(401).send({ message: 'Não autorizado.' });
    }
    const result = await reviewsService.toggleLike(request.params.id, userId);
    return reply.status(200).send(result);
};

export const presignMediaHandler: PresignReviewMediaHandler = async (request, reply) => {
    const userId = request.session?.user?.id;
    if (!userId) {
        return reply.status(401).send({ message: 'Não autorizado.' });
    }
    const result = await reviewsService.presignMedia(userId);
    return reply.status(200).send({ data: result });
};
