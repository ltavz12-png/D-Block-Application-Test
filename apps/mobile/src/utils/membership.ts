export type MembershipTier = 'free' | 'starter' | 'premium' | 'day_pass';

export function deriveTier(productName: string): MembershipTier {
  const lower = productName.toLowerCase();
  if (lower.includes('premium')) return 'premium';
  if (lower.includes('starter')) return 'starter';
  if (lower.includes('day')) return 'day_pass';
  return 'free';
}

export function billingPeriodLabel(
  period: string,
): string {
  switch (period) {
    case 'hourly': return '/hr';
    case 'daily': return '/day';
    case 'weekly': return '/week';
    case 'monthly': return '/mo';
    case 'quarterly': return '/quarter';
    case 'annually': return '/year';
    case 'one_time': return '';
    default: return '';
  }
}
