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

    getSheet().appendRow([
      new Date(),
      safe(data.name.trim()),
      data.attending ? 'Ja' : 'Nej',
      data.attending ? data.count : 0,
      safe((data.message || '').trim()),
    ]);

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
  if (typeof data.attending !== 'boolean') return 'invalid attending';
  if (!Number.isInteger(data.count) || data.count < 0 || data.count > 10) return 'invalid count';
  if (data.attending && data.count < 1) return 'invalid count';
  if (data.message != null && (typeof data.message !== 'string' || data.message.length > 500)) return 'invalid message';

  return null;
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
