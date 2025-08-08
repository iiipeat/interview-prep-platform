import { NextRequest } from 'next/server'
import { 
  successResponse, 
  errorResponse,
} from '@/lib/api-helpers'
import { withErrorHandler } from '@/lib/error-handler'
import { processWebhookEvent, type WebhookEvent } from '@/lib/stripe/webhook-handlers'

/**
 * POST /api/subscriptions/webhook
 * Handle Stripe webhook events for subscription management
 * This endpoint will be called by Stripe when subscription events occur
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')
    
    if (!sig) {
      return errorResponse('Missing stripe signature', 400)
    }
    
    // TODO: In production, verify webhook signature with Stripe
    // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    // const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    
    // For now, parse the JSON body directly (mock implementation)
    const event: WebhookEvent = JSON.parse(body)
    
    console.log('Received webhook event:', event.type)
    
    // Process the webhook event using our centralized handler
    await processWebhookEvent(event)
    
    return successResponse({ 
      received: true,
      eventType: event.type,
      eventId: event.id 
    })
    
  } catch (error) {
    console.error('Webhook error:', error)
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