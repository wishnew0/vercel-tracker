import { fetchUsageData, fetchAnalyticsData, fetchBillingCharges } from './vercel.js';
import { appendToSheet, getPreviousMiuFromSheet } from './sheets.js';

async function run() {
  try {
    const data = await fetchUsageData();
    const { start, end } = data.current;

    const cycleStart = new Date(start).toISOString();
    const cycleEnd = new Date(end).toISOString();

    const current = await fetchBillingCharges(cycleStart, cycleEnd);

    const previousMiu = await getPreviousMiuFromSheet();
    const dailyMiu: number | '' =
      previousMiu != null
        ? Math.round(current.totalMiu - previousMiu)
        : '';

    const analytics = await fetchAnalyticsData();

    await appendToSheet(
      start, end,
      analytics.total, analytics.devices,
      Math.round(current.totalMiu), dailyMiu,
      current.webAnalyticsMiu, current.speedInsightsMiu,
    );
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

run();
