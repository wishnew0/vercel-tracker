import { google } from 'googleapis';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function getCycleLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}

function getCredentials() {
  // GitHub Actions: stored as env var
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // Local: read from credentials.json
  return JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
}

export async function appendToSheet(start: number, end: number, pageViews: number, visitors: number) {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const time = now.toLocaleTimeString('en-US', {
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const row = [
    getCycleLabel(start),   // e.g. "Feb 2026"
    formatDate(start),      // e.g. "13 Feb 2026"
    formatDate(end),        // e.g. "05 Mar 2026"
    String(pageViews),      // e.g. "15394"
    String(visitors),       // e.g. "3861"
    date,                   // e.g. "Friday, February 13, 2026"
    time,                   // e.g. "5:20 PM"
  ];

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('Missing required environment variable: GOOGLE_SHEET_ID');

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:G',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });

  console.log(`Appended → Cycle: ${row[0]} | Start: ${row[1]} | End: ${row[2]} | Page Views: ${row[3]} | Visitors: ${row[4]} | Date: ${row[5]} | Time: ${row[6]}`);
}