import { WishlistService } from '../services/wishlist.service';
import type {
	AddWishlistItemHandler,
	CheckWishlistItemHandler,
	GetWishlistHandler,
	RemoveWishlistItemHandler,
} from '../../../types/handlers/wishlist.handlers';

const wishlistService = new WishlistService();

export const getWishlistHandler: GetWishlistHandler = async (request, reply) => {
	const result = await wishlistService.listProducts(request.session.user.id);
	return reply.status(200).send(result);
};

export const addWishlistItemHandler: AddWishlistItemHandler = async (request, reply) => {
	const result = await wishlistService.addProduct(
		request.session.user.id,
		request.params.productId,
	);
	return reply.status(200).send(result);
};

export const removeWishlistItemHandler: RemoveWishlistItemHandler = async (request, reply) => {
	const result = await wishlistService.removeProduct(
		request.session.user.id,
		request.params.productId,
	);
	return reply.status(200).send(result);
};

export const checkWishlistItemHandler: CheckWishlistItemHandler = async (request, reply) => {
	const isWishlisted = await wishlistService.isWishlisted(
		request.session.user.id,
		request.params.productId,
	);
	return reply.status(200).send({ productId: request.params.productId, isWishlisted });
};
