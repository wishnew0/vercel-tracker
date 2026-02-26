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
  // const webAnalyticsRecords: { date: string; quantity: number }[] = [];
  // const speedInsightsRecords: { date: string; quantity: number }[] = [];

  for (const line of lines) {
    const record = JSON.parse(line) as Record<string, unknown>;
    if (String(record['PricingUnit']) !== 'MIUs') continue;

    const quantity = Number(record['PricingQuantity'] ?? 0);
    // const description = String(record['ChargeDescription'] ?? record['ResourceType'] ?? '');
    // const date = String(record['ChargePeriodStartDate'] ?? '');

    totalMiu += quantity;

    // if (description === 'Web Analytics Events') {
    //   webAnalyticsRecords.push({ date, quantity });
    // } else if (description === 'Speed Insights Data Points') {
    //   speedInsightsRecords.push({ date, quantity });
    // }
  }

  // const latestWebDate = webAnalyticsRecords.reduce((max, r) => r.date > max ? r.date : max, '');
  // const webAnalyticsMiu = webAnalyticsRecords
  //   .filter(r => r.date === latestWebDate)
  //   .reduce((sum, r) => sum + r.quantity, 0);

  // const latestSpeedDate = speedInsightsRecords.reduce((max, r) => r.date > max ? r.date : max, '');
  // const speedInsightsMiu = speedInsightsRecords
  //   .filter(r => r.date === latestSpeedDate)
  //   .reduce((sum, r) => sum + r.quantity, 0);

  // console.log(`Latest ChargePeriodStartDate → Web Analytics: ${latestWebDate} | Speed Insights: ${latestSpeedDate}`);

  return { totalMiu, webAnalyticsMiu: 0, speedInsightsMiu: 0 };
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