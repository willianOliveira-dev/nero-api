import type {
    AddCartItemInput,
    ApplyCouponInput,
    CartItemParams,
    UpdateCartItemInput,
} from '../../modules/cart/validations/cart.validation';

import type { ZodHandler } from './root.handler';

export type GetCartHandler = ZodHandler;

export type ClearCartHandler = ZodHandler;

export type AddCartItemHandler = ZodHandler<unknown, AddCartItemInput>;

export type UpdateCartItemHandler = ZodHandler<
    CartItemParams,
    UpdateCartItemInput
>;

export type RemoveCartItemHandler = ZodHandler<CartItemParams>;

export type ApplyCouponHandler = ZodHandler<unknown, ApplyCouponInput>;

export type RemoveCouponHandler = ZodHandler;

export type ValidateCouponHandler = ZodHandler<{ code: string }>;
