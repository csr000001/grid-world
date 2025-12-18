import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export async function createCheckoutSession(gridId: number) {
  const stripe = await stripePromise;
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gridId }),
  });

  const session = await response.json();
  if (session.error) return { error: session.error };

  // Redirect to Stripe checkout page
  const result = await stripe?.redirectToCheckout({
    sessionId: session.id,
  });

  if (result?.error) return { error: result.error };
  return { success: true };
}