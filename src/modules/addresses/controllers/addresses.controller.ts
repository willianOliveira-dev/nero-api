import type {
    CreateAddressHandler,
    DeleteAddressHandler,
    GetDefaultAddressHandler,
    ListAddressesHandler,
    SetDefaultAddressHandler,
    UpdateAddressHandler,
} from '../../../types/handlers/addresses.handlers';
import { AddressesService } from '../services/addresses.service';

const addressesService = new AddressesService();

export class AddressesController {
    list: ListAddressesHandler = async (request, reply) => {
        const { user } = request.session;

        const addresses = await addressesService.listAddresses(user.id);

        return reply.status(200).send({
            data: addresses,
        });
    };

    getDefault: GetDefaultAddressHandler = async (request, reply) => {
        const { user } = request.session;

        const address = await addressesService.getDefault(user.id);

        return reply.status(200).send({
            data: address,
        });
    };

    create: CreateAddressHandler = async (request, reply) => {
        const { user } = request.session;

        const address = await addressesService.createAddress(
            user.id,
            request.body,
        );

        return reply.status(201).send({
            data: address,
        });
    };

    update: UpdateAddressHandler = async (request, reply) => {
        const { user } = request.session;

        const address = await addressesService.updateAddress(
            request.params.id,
            user.id,
            request.body,
        );

        return reply.status(200).send({
            data: address,
        });
    };

    setDefault: SetDefaultAddressHandler = async (request, reply) => {
        const { user } = request.session;

        const address = await addressesService.setDefault(
            request.params.id,
            user.id,
        );

        return reply.status(200).send({
            data: address,
        });
    };

    delete: DeleteAddressHandler = async (request, reply) => {
        const { user } = request.session;

        const result = await addressesService.deleteAddress(
            request.params.id,
            user.id,
        );

        return reply.status(200).send({
            data: result,
        });
    };
}
