import { CartService } from '../services/cart.service';
import type {
    AddCartItemHandler,
    ApplyCouponHandler,
    ClearCartHandler,
    GetCartHandler,
    RemoveCartItemHandler,
    RemoveCouponHandler,
    UpdateCartItemHandler,
    ValidateCouponHandler,
} from '../../../types/handlers/cart.handlers';

const cartService = new CartService();

export const getCartHandler: GetCartHandler = async (request, reply) => {
    const cart = await cartService.getCart(request.session.user.id);
    return reply.status(200).send(cart);
};

export const addCartItemHandler: AddCartItemHandler = async (request, reply) => {
    const cart = await cartService.addItem(
        request.session.user.id,
        request.body,
    );
    return reply.status(200).send(cart);
};

export const updateCartItemHandler: UpdateCartItemHandler = async (request, reply) => {
    const cart = await cartService.updateItem(
        request.session.user.id,
        request.params.itemId,
        request.body,
    );
    return reply.status(200).send(cart);
};

export const removeCartItemHandler: RemoveCartItemHandler = async (request, reply) => {
    const cart = await cartService.removeItem(
        request.session.user.id,
        request.params.itemId,
    );
    return reply.status(200).send(cart);
};

export const applyCouponHandler: ApplyCouponHandler = async (request, reply) => {
    const cart = await cartService.applyCoupon(
        request.session.user.id,
        request.body.code,
    );
    return reply.status(200).send(cart);
};

export const removeCouponHandler: RemoveCouponHandler = async (request, reply) => {
    const cart = await cartService.removeCoupon(request.session.user.id);
    return reply.status(200).send(cart);
};

export const validateCouponHandler: ValidateCouponHandler = async (request, reply) => {
    const result = await cartService.validateCoupon(
        request.params.code,
        request.session.user.id,
    );
    return reply.status(200).send(result);
};

export const clearCartHandler: ClearCartHandler = async (request, reply) => {
    await cartService.clearCart(request.session.user.id);
    return reply.status(200).send({ cleared: true });
};
