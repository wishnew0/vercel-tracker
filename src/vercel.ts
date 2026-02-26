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