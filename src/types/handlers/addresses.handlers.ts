import type { RouteHandler } from 'fastify';

import type {
    CreateAddressInput,
    UpdateAddressInput,
} from '../../modules/addresses/validations/addresses.validation';

export type ListAddressesHandler = RouteHandler;

export type GetDefaultAddressHandler = RouteHandler;

export type CreateAddressHandler = RouteHandler<{
    Body: CreateAddressInput;
}>;

export type UpdateAddressHandler = RouteHandler<{
    Params: {
        id: string;
    };
    Body: UpdateAddressInput;
}>;

export type SetDefaultAddressHandler = RouteHandler<{
    Params: {
        id: string;
    };
}>;

export type DeleteAddressHandler = RouteHandler<{
    Params: {
        id: string;
    };
}>;
