/* 
 * Запускается локально (НЕ на Vercel).
 * Задача: по таблице report_check_links прочитать все ссылки amoCRM,
 * сходить в amo по каждой ссылке (Playwright), получить число
 * и записать его в таблицу report_check_auto_values для указанной даты (по умолчанию вчера).
 *
 * Требуемые переменные окружения:
 * - GOOGLE_PROJECT_ID
 * - GOOGLE_CLIENT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_SHEETS_SPREADSHEET_ID
 * - AMO_LOGIN
 * - AMO_PASSWORD
 */

// Загружаем переменные окружения из .env.local (если есть) и .env
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();
const { google } = require("googleapis");
const { chromium } = require("playwright");

const LINKS_SHEET = "report_check_links";
const AUTO_SHEET = "report_check_auto_values";

function getReportDateFromArgs() {
  const arg = process.argv[2];
  if (arg) return arg;
  const today = new Date();
  const y = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 1),
  )
    .toISOString()
    .slice(0, 10);
  return y;
}

function getSheetsClient() {
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("GOOGLE_PROJECT_ID =", projectId);
    console.error("GOOGLE_CLIENT_EMAIL =", clientEmail);
    console.error(
      "GOOGLE_PRIVATE_KEY is",
      privateKey ? `set (length ${privateKey.length})` : "NOT set",
    );
    throw new Error("Google service account env vars are not set");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    subject: undefined,
    keyId: undefined,
  });

  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  }

  return { sheets, spreadsheetId };
}

async function loadAllLinks() {
  const { sheets, spreadsheetId } = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${LINKS_SHEET}!A:Z`,
  });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];
  const [, ...dataRows] = rows;
  const items = [];
  for (const row of dataRows) {
    const [userId, metricKey, url] = row;
    if (!userId || !metricKey || !url) continue;
    items.push({ userId, metricKey, url });
  }
  return items;
}

async function appendAutoValues(records) {
  if (records.length === 0) return;
  const { sheets, spreadsheetId } = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${AUTO_SHEET}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: records.map((r) => [
        r.userId,
        r.metricKey,
        r.reportDate,
        r.autoValue,
        r.updatedAt,
      ]),
    },
  });
}

async function loginToAmo(page) {
  const login = process.env.AMO_LOGIN;
  const password = process.env.AMO_PASSWORD;
  if (!login || !password) {
    throw new Error("AMO_LOGIN and AMO_PASSWORD must be set");
  }

  await page.goto("https://zimaamo.amocrm.ru/", { waitUntil: "load" });

  await page.fill('input[name="login"], input[name="username"]', login);
  await page.fill('input[type="password"]', password);

  await page.click(
    'button[type="submit"], button:has-text("Войти"), button:has-text("Log in")',
  );

  await page.waitForLoadState("networkidle");
}

async function fetchNumericFromUrl(url, sharedContext) {
  const { browser, page } = sharedContext;
  try {
    await page.goto(url, { waitUntil: "load", timeout: 120000 });
    const locator = page.locator(".list-top-search__summary-text");
    await locator.waitFor({ timeout: 60000 });
    const text = await locator.innerText();
    const match = text.match(/\d+/);
    const numeric = match ? Number(match[0]) : null;
    return Number.isFinite(numeric) ? numeric : null;
  } catch (err) {
    console.error("Failed to fetch from URL", url, err.message);
    return null;
  }
}

async function main() {
  const reportDate = getReportDateFromArgs();
  console.log(`Report check fetch for date: ${reportDate}`);

  const links = await loadAllLinks();
  if (links.length === 0) {
    console.log("No links found in sheet", LINKS_SHEET);
    return;
  }
  console.log(`Found ${links.length} link rows`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const sharedContext = { browser, page };

  try {
    await loginToAmo(page);

    const now = new Date().toISOString();
    const recordsToAppend = [];

    for (const link of links) {
      const autoValue = await fetchNumericFromUrl(link.url, sharedContext);
      if (autoValue == null) continue;
      recordsToAppend.push({
        userId: link.userId,
        metricKey: link.metricKey,
        reportDate,
        autoValue,
        updatedAt: now,
      });
    }

    await appendAutoValues(recordsToAppend);
    console.log(`Appended ${recordsToAppend.length} auto value rows`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("report-check-fetch-amo failed:", err);
  process.exit(1);
});

