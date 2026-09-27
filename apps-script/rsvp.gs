/**
 * RSVP endpoint for Kasper & Mette's 30th birthday site.
 * Deploy as a web app bound to the response spreadsheet – see README.md.
 */
const SHEET_NAME = 'Svar';
const HEADERS = ['Tidspunkt', 'Navn', 'Deltager', 'Antal', 'Besked'];

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const data = JSON.parse(e.postData.contents);
    const error = validate(data);
    if (error) {
      return json({ ok: false, error: error });
    }

    const sheet = getSheet();
    const row = [
      new Date(),
      safe(data.name.trim().replace(/\s+/g, ' ')),
      data.attending ? 'Ja' : 'Nej',
      data.attending ? data.count : 0,
      safe((data.message || '').trim()),
    ];

    const existing = findRow(sheet, data.name);
    if (existing) {
      if (!data.update) {
        return json({ ok: false, error: 'duplicate' });
      }
      sheet.getRange(existing, 1, 1, row.length).setValues([row]);
      return json({ ok: true, updated: true });
    }

    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'invalid request' });
  } finally {
    lock.releaseLock();
  }
}

function validate(data) {
  if (!data || typeof data !== 'object') return 'invalid body';
  if (typeof data.name !== 'string') return 'invalid name';

  const name = data.name.trim();
  if (name.length < 1 || name.length > 100) return 'invalid name';
  if (name.split(/\s+/).length < 2) return 'full name required';
  if (typeof data.attending !== 'boolean') return 'invalid attending';
  if (!Number.isInteger(data.count) || data.count < 0 || data.count > 10) return 'invalid count';
  if (data.attending && data.count < 1) return 'invalid count';
  if (data.message != null && (typeof data.message !== 'string' || data.message.length > 500)) return 'invalid message';

  return null;
}

/** Names match regardless of case and extra spaces: "anna  HANSEN" is "Anna Hansen". */
function normalize(name) {
  return String(name).trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Sheet row number (1-based) of an existing answer with this name, or 0. */
function findRow(sheet, name) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const wanted = normalize(name);
  const names = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let i = 0; i < names.length; i++) {
    // Stored names may carry the formula-escape quote; compare without it.
    if (normalize(String(names[i][0]).replace(/^'/, '')) === wanted) return i + 2;
  }
  return 0;
}

/** Prevent spreadsheet formula injection from guest input. */
function safe(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
