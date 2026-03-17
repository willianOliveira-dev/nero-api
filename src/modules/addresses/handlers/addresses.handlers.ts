import { AddressesService } from '../services/addresses.service';
import type {
    CreateAddressHandler,
    DeleteAddressHandler,
    GetDefaultAddressHandler,
    ListAddressesHandler,
    SetDefaultAddressHandler,
    UpdateAddressHandler,
} from '../../../types/handlers/addresses.handlers';

const addressesService = new AddressesService();

export const listAddressesHandler: ListAddressesHandler = async (request, reply) => {
    const { user } = request.session;
    const addresses = await addressesService.listAddresses(user.id);
    return reply.status(200).send(addresses);
};

export const getDefaultAddressHandler: GetDefaultAddressHandler = async (request, reply) => {
    const { user } = request.session;
    const address = await addressesService.getDefault(user.id);
    return reply.status(200).send(address);
};

export const createAddressHandler: CreateAddressHandler = async (request, reply) => {
    const { user } = request.session;
    const address = await addressesService.createAddress(
        user.id,
        request.body,
    );
    return reply.status(201).send(address);
};

export const updateAddressHandler: UpdateAddressHandler = async (request, reply) => {
    const { user } = request.session;
    const address = await addressesService.updateAddress(
        request.params.id,
        user.id,
        request.body,
    );
    return reply.status(200).send(address);
};

export const setDefaultAddressHandler: SetDefaultAddressHandler = async (request, reply) => {
    const { user } = request.session;
    const address = await addressesService.setDefault(
        request.params.id,
        user.id,
    );
    return reply.status(200).send(address);
};

export const deleteAddressHandler: DeleteAddressHandler = async (request, reply) => {
    const { user } = request.session;
    const result = await addressesService.deleteAddress(
        request.params.id,
        user.id,
    );
    return reply.status(200).send(result);
};
