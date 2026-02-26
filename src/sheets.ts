import { google } from 'googleapis';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

function getCredentials() {
  // GitHub Actions: stored as env var
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // Local: read from credentials.json
  return JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
}

export async function appendToSheet(
  start: number,
  end: number,
  pageViews: number,
  visitors: number,
  totalMiu: number,
  dailyMiu: number,
  // webAnalyticsMiu: number,
  // speedInsightsMiu: number,
) {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('Missing required environment variable: GOOGLE_SHEET_ID');

  const now = new Date();

  // A: "Current Billing Cycle" if today falls within the cycle, else the date range
  const today = now.getTime();
  const cycleLabel = today >= start && today <= end ? 'Current Billing Cycle' : '';

  // B: Tracked on (Date) e.g. "Friday, February 13, 2026"
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  // C: Timestamp (IST) e.g. "5:20 PM"
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });

  const row = [
    cycleLabel,           // A: Billing Cycle
    date,                 // B: Tracked on (Date)
    time,                 // C: Timestamp (IST)
    totalMiu,             // D: MIU Consumption (Cumulative)
    dailyMiu,             // E: Daily Consumption (Difference) = today cumulative - yesterday cumulative
    String(visitors),     // F: Visitors (24hrs)
    String(pageViews),    // G: Page Views (24hrs)
    // webAnalyticsMiu,   // H: Web Analytics (MIU) - latest ChargePeriodStartDate
    // speedInsightsMiu,  // I: Speed Insights (MIU) - latest ChargePeriodStartDate
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  console.log(
    `Appended → ${cycleLabel} | ${date} | ${time} | ` +
    `MIU: ${totalMiu} | Daily MIU: ${dailyMiu} | Visitors: ${visitors} | Page Views: ${pageViews} | ` +
    ``
  );
}
