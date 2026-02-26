import { fetchUsageData, fetchAnalyticsData, fetchBillingCharges } from './vercel.js';
import { appendToSheet, getPreviousMiuFromSheet } from './sheets.js';

async function run() {
  try {
    console.log('Fetching Vercel usage data...');
    const data = await fetchUsageData();
    const { start, end } = data.current;
    console.log(`Current cycle: ${new Date(start).toISOString()} → ${new Date(end).toISOString()}`);

    const cycleStart = new Date(start).toISOString();
    const cycleEnd = new Date(end).toISOString();

    console.log('Fetching total MIU (current cycle: start → end)...');
    const current = await fetchBillingCharges(cycleStart, cycleEnd);
    console.log(`Total MIU (current cycle): ${current.totalMiu}`);

    const previousMiu = await getPreviousMiuFromSheet();
    const dailyMiu: number | '' =
      previousMiu != null
        ? Math.round(current.totalMiu - previousMiu)
        : '';
    console.log(
      previousMiu != null
        ? `Daily MIU (current − previous row): ${dailyMiu}`
        : 'Daily Consumption: (empty — no previous row or cell is header/empty)'
    );

    console.log('Fetching web analytics data (last 24h)...');
    const analytics = await fetchAnalyticsData();
    console.log(`Page Views: ${analytics.total} | Visitors: ${analytics.devices}`);

    await appendToSheet(
      start, end,
      analytics.total, analytics.devices,
      Math.round(current.totalMiu), dailyMiu,
      current.webAnalyticsMiu, current.speedInsightsMiu,
    );
    console.log('Done.');
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

run();
