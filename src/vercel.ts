import axios from 'axios';
import * as dotenv from 'dotenv';                                                                   
dotenv.config();

export interface BillingCycle {
  start: number;
  end: number;
}

export interface UsageResponse {
  current: BillingCycle;
  previous: BillingCycle;
}

export interface AnalyticsResponse {
  total: number;
  devices: number;
  bounceRate: number;
}

export async function fetchUsageData(): Promise<UsageResponse> {
  const response = await axios.get('https://api.vercel.com/v2/usage', {
    params: {
      cycles: 1,
      teamId: process.env.VERCEL_TEAM_ID,
    },
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
  });

  return response.data;
}

export interface BillingCharges {
  totalMiu: number;
  webAnalyticsMiu: number;
  speedInsightsMiu: number;
}

export async function fetchBillingCharges(from: string, to: string): Promise<BillingCharges> {
  console.log('[Billing API] params sent — from:', JSON.stringify(from), 'to:', JSON.stringify(to));
  const response = await axios.get<string>('https://api.vercel.com/v1/billing/charges', {
    params: {
      from,
      to,
      teamId: process.env.VERCEL_TEAM_ID,
    },
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      'Accept-Encoding': 'gzip',
    },
    responseType: 'text',
  });

  const lines = response.data.split('\n').filter(line => line.trim());

  let totalMiu = 0;
  type PeriodRecord = { periodStart: string; periodEnd: string; serviceName: string; quantity: number };
  const periodRecords: PeriodRecord[] = [];

  const periodStartKey = (r: Record<string, unknown>) =>
    String(r['ChargePeriodStart'] ?? r['ChargePeriodStartDate'] ?? '');
  const periodEndKey = (r: Record<string, unknown>) =>
    String(r['ChargePeriodEnd'] ?? r['ChargePeriodEndDate'] ?? '');
  const serviceName = (r: Record<string, unknown>) =>
    String(r['ServiceName'] ?? r['ChargeDescription'] ?? r['ResourceType'] ?? '');

  for (const line of lines) {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (String(record['PricingUnit']) !== 'MIUs') continue;

    const quantity = Number(record['PricingQuantity'] ?? 0);
    totalMiu += quantity;

    const name = serviceName(record);
    if (name === 'Web Analytics Events' || name === 'Speed Insights Data Points') {
      periodRecords.push({
        periodStart: periodStartKey(record),
        periodEnd: periodEndKey(record),
        serviceName: name,
        quantity,
      });
    }
  }

  const now = new Date();
  const nowTime = now.getTime();
  const periods = [...new Set(periodRecords.map((r) => r.periodStart))].filter(Boolean);
  const periodJustBeforeNow = periods
    .map((start) => ({ start, startTime: new Date(start).getTime() }))
    .filter((p) => p.startTime <= nowTime)
    .sort((a, b) => b.startTime - a.startTime)[0];

  let webAnalyticsMiu = 0;
  let speedInsightsMiu = 0;
  if (periodJustBeforeNow) {
    const rangeStart = periodJustBeforeNow.start;
    const matchingRecords = periodRecords.filter((r) => r.periodStart === rangeStart);
    const periodEnd = matchingRecords[0]?.periodEnd ?? '(unknown)';
    console.log(
      '[Billing API] ChargePeriodStart chosen:',
      rangeStart,
      '| ChargePeriodEnd:',
      periodEnd
    );
    webAnalyticsMiu = matchingRecords
      .filter((r) => r.serviceName === 'Web Analytics Events')
      .reduce((sum, r) => sum + r.quantity, 0);
    speedInsightsMiu = matchingRecords
      .filter((r) => r.serviceName === 'Speed Insights Data Points')
      .reduce((sum, r) => sum + r.quantity, 0);
  } else {
    console.log('[Billing API] No ChargePeriodStart chosen (no period with start <= now in response).');
  }

  return { totalMiu, webAnalyticsMiu, speedInsightsMiu };
}

export async function fetchAnalyticsData(): Promise<AnalyticsResponse> {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

  const response = await axios.get('https://vercel.com/api/web-analytics/overview', {
    params: {
      environment: 'production',
      filter: '{}',
      from: from.toISOString(),
      to: to.toISOString(),
      projectId: process.env.VERCEL_PROJECT_ID,
      teamId: process.env.VERCEL_TEAM_ID,
      tz: 'Asia/Kolkata',
    },
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
  });

  return response.data;
}