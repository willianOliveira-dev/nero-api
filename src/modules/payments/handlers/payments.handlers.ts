import { PaymentsService } from '../services/payments.service';
import type {
    CreateSetupIntentHandler,
    ListPaymentMethodsHandler,
    SetDefaultPaymentMethodHandler,
    DeletePaymentMethodHandler,
    CreatePaymentIntentHandler,
} from '../../../types/handlers/payments.handlers';

const paymentsService = new PaymentsService();

export const createSetupIntentHandler: CreateSetupIntentHandler = async (
    request,
    reply,
) => {
    const result = await paymentsService.createSetupIntent(
        request.session.user.id,
        request.session.user.email,
    );
    return reply.status(200).send(result);
};

export const listPaymentMethodsHandler: ListPaymentMethodsHandler = async (
    request,
    reply,
) => {
    const result = await paymentsService.listPaymentMethods(
        request.session.user.id,
    );
    return reply.status(200).send(result);
};

export const setDefaultPaymentMethodHandler: SetDefaultPaymentMethodHandler =
    async (request, reply) => {
        const result = await paymentsService.setDefaultPaymentMethod(
            request.session.user.id,
            request.params.id,
        );
        return reply.status(200).send(result);
    };

export const deletePaymentMethodHandler: DeletePaymentMethodHandler = async (
    request,
    reply,
) => {
    const result = await paymentsService.deletePaymentMethod(
        request.session.user.id,
        request.params.id,
    );
    return reply.status(200).send(result);
};

export const createPaymentIntentHandler: CreatePaymentIntentHandler = async (
    request,
    reply,
) => {
    const result = await paymentsService.createPaymentIntent(
        request.session.user.id,
        request.body,
    );
    return reply.status(200).send(result);
};
