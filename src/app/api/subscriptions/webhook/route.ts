import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { processWebhookEvent, type WebhookEvent } from '@/lib/stripe/webhook-handlers'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/subscriptions/webhook
 * Handle Stripe webhook events for subscription management
 * This endpoint will be called by Stripe when subscription events occur
 * 
 * Supported events:
 * - customer.subscription.trial_will_end (3 days before trial expires)
 * - customer.subscription.created (new subscription started)
 * - customer.subscription.updated (subscription modified)
 * - customer.subscription.deleted (subscription canceled)
 * - invoice.payment_succeeded (successful payment)
 * - invoice.payment_failed (failed payment)
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const startTime = Date.now()
  let event: WebhookEvent | null = null

  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    
    if (!sig) {
      console.error('Webhook error: Missing Stripe signature')
      return errorResponse('Missing stripe signature', 400)
    }

    // Verify webhook signature with Stripe
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    
    if (webhookSecret && webhookSecret !== 'whsec_example123...') {
      // Production mode: Verify signature
      try {
        const stripeEvent = stripe.verifyWebhookSignature(body, sig)
        event = stripeEvent as any
        console.log(`Verified webhook signature for event: ${event.type}`)
      } catch (err) {
        console.error('Webhook signature verification failed:', err)
        return errorResponse('Invalid signature', 400)
      }
    } else {
      // Development mode: Parse JSON directly (for testing)
      console.warn('⚠️  Webhook signature verification skipped (development mode)')
      try {
        event = JSON.parse(body)
        
        // Validate event structure
        if (!event || !event.id || !event.type || !event.data) {
          throw new Error('Invalid webhook event structure')
        }
      } catch (parseError) {
        console.error('Webhook error: Invalid JSON body', parseError)
        return errorResponse('Invalid webhook payload', 400)
      }
    }
    
    console.log(`Received webhook event: ${event.type} (ID: ${event.id})`)
    
    // Validate supported event types
    const supportedEvents = [
      'customer.subscription.trial_will_end',
      'customer.subscription.created', 
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'checkout.session.completed',
      'customer.created',
      'payment_intent.succeeded',
      'payment_intent.payment_failed'
    ]
    
    if (!supportedEvents.includes(event.type)) {
      console.log(`Unsupported webhook event type: ${event.type}`)
      return successResponse({ 
        received: true,
        eventType: event.type,
        eventId: event.id,
        message: 'Event type not handled'
      })
    }
    
    // Process the webhook event using our centralized handler
    await processWebhookEvent(event)
    
    const processingTime = Date.now() - startTime
    console.log(`Webhook processed successfully: ${event.type} in ${processingTime}ms`)
    
    return successResponse({ 
      received: true,
      eventType: event.type,
      eventId: event.id,
      processingTime
    })
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    const eventInfo = event ? `${event.type} (${event.id})` : 'unknown'
    
    console.error(`Webhook processing failed for ${eventInfo} after ${processingTime}ms:`, error)
    
    // Return success to Stripe to prevent retries for non-retryable errors
    if (error instanceof Error) {
      if (error.message.includes('User not found') || 
          error.message.includes('Invalid webhook payload')) {
        return successResponse({ 
          received: true,
          error: error.message,
          eventType: event?.type || 'unknown',
          eventId: event?.id || 'unknown'
        })
      }
    }
    
    // Return error for retryable failures
    return errorResponse('Webhook processing failed', 500)
  }
})


export const OPTIONS = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, stripe-signature',
    },
  })
}