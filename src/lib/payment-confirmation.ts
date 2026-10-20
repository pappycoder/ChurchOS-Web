import type { BillingStatus } from '@/types/billing';

export function paymentOutcome(data: BillingStatus | undefined, reference: string) {
  const payment = data?.verification?.reference === reference
    ? data.verification : data?.payments?.find(payment => payment.reference === reference);
  if (payment?.status === 'success' && payment.application_status === 'review') return 'review';
  if (payment?.status === 'success' && payment.application_status === 'applied' && data?.active) return 'applied';
  if (payment?.status === 'failed' || payment?.status === 'reversed') return 'failed';
  return 'pending';
}
