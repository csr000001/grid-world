import { handleAirwallexWebhook } from '@/lib/airwallex';

export async function POST(req: Request) {
  return handleAirwallexWebhook(req);
}