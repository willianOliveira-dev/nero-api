import { OrdersService } from '../services/orders.service';
import type {
    CancelOrderHandler,
    GetOrderHandler,
    ListAllOrdersHandler,
    ListOrdersHandler,
    UpdateOrderStatusHandler,
} from '../../../types/handlers/orders.handlers';

const ordersService = new OrdersService();

export const listOrdersHandler: ListOrdersHandler = async (request, reply) => {
    const result = await ordersService.listOrders(
        request.session.user.id,
        request.query,
    );
    return reply.status(200).send(result);
};

export const getOrderHandler: GetOrderHandler = async (request, reply) => {
    const order = await ordersService.getOrder(
        request.params.id,
        request.session.user.id,
    );
    return reply.status(200).send(order);
};

export const cancelOrderHandler: CancelOrderHandler = async (request, reply) => {
    const order = await ordersService.cancelOrder(
        request.params.id,
        request.session.user.id,
    );
    return reply.status(200).send(order);
};

export const listAllOrdersHandler: ListAllOrdersHandler = async (request, reply) => {
    const result = await ordersService.listAllOrders(request.query);
    return reply.status(200).send(result);
};

export const updateOrderStatusHandler: UpdateOrderStatusHandler = async (request, reply) => {
    const order = await ordersService.updateOrderStatus(
        request.params.id,
        request.body,
    );
    return reply.status(200).send(order);
};
