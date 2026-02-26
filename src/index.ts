import { fetchUsageData, fetchAnalyticsData, fetchBillingCharges } from './vercel.js';
import { appendToSheet } from './sheets.js';

async function run() {
  try {
    console.log('Fetching Vercel usage data...');
    const data = await fetchUsageData();
    const { start, end } = data.current;
    console.log(`Current cycle: ${new Date(start).toISOString()} → ${new Date(end).toISOString()}`);

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cycleStart = new Date(start).toISOString();

    console.log('Fetching cumulative MIU (cycle start → now)...');
    const current = await fetchBillingCharges(cycleStart, now.toISOString());
    console.log(`Cumulative MIU: ${current.totalMiu}`);

    console.log('Fetching previous MIU (cycle start → 24h ago)...');
    const previous = await fetchBillingCharges(cycleStart, yesterday.toISOString());
    console.log(`Previous MIU: ${previous.totalMiu}`);

    const dailyMiu = Math.round(current.totalMiu - previous.totalMiu);
    console.log(`Daily MIU: ${dailyMiu}`);

    console.log('Fetching web analytics data (last 24h)...');
    const analytics = await fetchAnalyticsData();
    console.log(`Page Views: ${analytics.total} | Visitors: ${analytics.devices}`);

    await appendToSheet(
      start, end,
      analytics.total, analytics.devices,
      Math.round(current.totalMiu), dailyMiu,
      // current.webAnalyticsMiu, current.speedInsightsMiu,
    );
    console.log('Done.');
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

run();
