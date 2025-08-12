// Simple webhook tester for Stripe
// Run this to generate a webhook secret for local testing

const crypto = require('crypto');

// Generate a test webhook secret
const testWebhookSecret = 'whsec_test_' + crypto.randomBytes(32).toString('hex');

console.log('================================');
console.log('LOCAL TESTING WEBHOOK SECRET');
console.log('================================');
console.log('Add this to your .env.local file:');
console.log('');
console.log('STRIPE_WEBHOOK_SECRET=' + testWebhookSecret);
console.log('');
console.log('================================');
console.log('');
console.log('For production, you\'ll get a real webhook secret from Stripe Dashboard.');
console.log('');
console.log('To test Stripe CLI when installed:');
console.log('1. Run: stripe login');
console.log('2. Run: stripe listen --forward-to localhost:3000/api/subscriptions/webhook');
console.log('3. Use the webhook secret it provides');