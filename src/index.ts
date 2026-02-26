import { fetchUsageData, fetchAnalyticsData } from './vercel.js';
import { appendToSheet } from './sheets.js';

async function run() {
  try {
    console.log('Fetching Vercel usage data...');
    const data = await fetchUsageData();
    const { start, end } = data.current;
    console.log(`Current cycle: ${start} → ${end}`);

    console.log('Fetching Vercel analytics data (last 24h)...');
    const analytics = await fetchAnalyticsData();
    console.log(`Page Views: ${analytics.total} | Visitors: ${analytics.devices}`);

    await appendToSheet(start, end, analytics.total, analytics.devices);
    console.log('Done.');
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

run();