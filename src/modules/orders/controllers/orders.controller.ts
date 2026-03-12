import type {
    CancelOrderHandler,
    GetOrderHandler,
    ListAllOrdersHandler,
    ListOrdersHandler,
    UpdateOrderStatusHandler,
} from '../../../types/handlers/orders.handlers';
import { OrdersService } from '../services/orders.service';

const ordersService = new OrdersService();

export class OrdersController {
    list: ListOrdersHandler = async (request, reply) => {
        const result = await ordersService.listOrders(
            request.session.user.id,
            request.query,
        );
        return reply.status(200).send({
            data: result.data,
            meta: {
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
            },
        });
    };

    getById: GetOrderHandler = async (request, reply) => {
        const order = await ordersService.getOrder(
            request.params.id,
            request.session.user.id,
        );
        return reply.status(200).send({ data: order });
    };

    cancel: CancelOrderHandler = async (request, reply) => {
        const order = await ordersService.cancelOrder(
            request.params.id,
            request.session.user.id,
        );
        return reply.status(200).send({ data: order });
    };

    listAll: ListAllOrdersHandler = async (request, reply) => {
        const result = await ordersService.listAllOrders(request.query);
        return reply.status(200).send({
            data: result.data,
            meta: {
                hasMore: result.hasMore,
                nextCursor: result.nextCursor,
            },
        });
    };

    updateStatus: UpdateOrderStatusHandler = async (request, reply) => {
        const order = await ordersService.updateOrderStatus(
            request.params.id,
            request.body,
        );
        return reply.status(200).send({ data: order });
    };
}
