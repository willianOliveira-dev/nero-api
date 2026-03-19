import type { FastifyRequest, FastifyReply } from 'fastify';
import { stripe } from '@/lib/stripe';
import { env } from '@/config/env';
import { PaymentsService } from '../services/payments.service';
import type Stripe from 'stripe';

const paymentsService = new PaymentsService();

export async function stripeWebhookHandler(
    request: FastifyRequest,
    reply: FastifyReply,
) {
    const sig = request.headers['stripe-signature'];

    if (!sig) {
        return reply.status(400).send({ error: 'Missing stripe-signature header.' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            request.rawBody as string,
            sig,
            env.STRIPE_WEBHOOK_SECRET,
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        request.log.error(`Webhook signature verification failed: ${message}`);
        return reply.status(400).send({ error: `Webhook Error: ${message}` });
    }

    request.log.info(`Stripe webhook received: ${event.type}`);

    try {
        switch (event.type) {
            case 'setup_intent.succeeded':
                await paymentsService.handleSetupIntentSucceeded(
                    event.data.object as Stripe.SetupIntent,
                );
                break;

            case 'setup_intent.canceled':
                await paymentsService.handleSetupIntentCancelled(
                    event.data.object as Stripe.SetupIntent,
                );
                break;

            case 'payment_intent.succeeded':
                await paymentsService.handlePaymentIntentSucceeded(
                    event.data.object as Stripe.PaymentIntent,
                );
                break;

            case 'payment_intent.payment_failed':
                await paymentsService.handlePaymentIntentFailed(
                    event.data.object as Stripe.PaymentIntent,
                );
                break;

            case 'charge.refunded':
                await paymentsService.handleChargeRefunded(
                    event.data.object as Stripe.Charge,
                );
                break;

            default:
                request.log.info(`Unhandled event type: ${event.type}`);
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        request.log.error(`Error processing webhook ${event.type}: ${message}`);
        // Return 200 to prevent Stripe from retrying
        return reply.status(200).send({ received: true, error: message });
    }

    return reply.status(200).send({ received: true });
}
