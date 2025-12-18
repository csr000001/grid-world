import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature')!;

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err}` }, { status: 400 });
  }

  // Payment success: Update grid ownership
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const gridId = parseInt(session.metadata?.gridId!);
    const userId = session.metadata?.userId!;

    // Calculate rental end time (1 year later)
    const rentalEnd = new Date();
    rentalEnd.setFullYear(rentalEnd.getFullYear() + 1);

    // 1. Update grid
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies }
    );
    await supabase
      .from('grids')
      .update({
        user_id: userId,
        rental_end: rentalEnd,
        curtain_color: '#FF0000', // Default red curtain (customizable later)
      })
      .eq('id', gridId);

    // 2. Create order record
    await supabase
      .from('orders')
      .insert({
        id: session.id,
        user_id: userId,
        grid_id: gridId,
      });
  }

  return NextResponse.json({ received: true });
}