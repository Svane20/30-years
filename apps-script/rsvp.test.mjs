// Tests for rsvp.gs, run with `node --test apps-script/`.
// Apps Script isn't a module, so the script is loaded into a sandbox with fake Google services.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const code = readFileSync(new URL('./rsvp.gs', import.meta.url), 'utf8');

/** A fresh script instance with an in-memory "Svar" sheet. */
function load(existingRows = []) {
  const rows = existingRows.length ? [['Tidspunkt', 'Navn', 'Deltager', 'Antal', 'Besked'], ...existingRows] : [];
  let sheet = null;
  const makeSheet = () => ({
    appendRow: row => rows.push(Array.from(row)), // copy out of the sandbox realm so deepEqual compares plain arrays
    setFrozenRows() {},
    getLastRow: () => rows.length,
    getRange: (row, col, numRows = 1, numCols = 1) => ({
      getValues: () => rows.slice(row - 1, row - 1 + numRows).map(r => r.slice(col - 1, col - 1 + numCols)),
      setValues: values => values.forEach((v, i) => rows[row - 1 + i].splice(col - 1, v.length, ...v)),
    }),
  });
  if (rows.length) sheet = makeSheet();

  const sandbox = {
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: () => sheet,
        insertSheet: () => (sheet = makeSheet()),
      }),
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: text => ({ setMimeType: () => text }) },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  const post = body => JSON.parse(sandbox.doPost({ postData: { contents: JSON.stringify(body) } }));
  const data = () => rows.slice(1).map(r => r.slice(1)); // without header and timestamp
  return { post, data, rows };
}

const anna = { name: 'Anna Hansen', attending: true, count: 2, message: 'Glæder mig' };

test('saves a new answer with a header row', () => {
  const s = load();
  assert.deepEqual(s.post(anna), { ok: true });
  assert.deepEqual(s.rows[0], ['Tidspunkt', 'Navn', 'Deltager', 'Antal', 'Besked']);
  assert.deepEqual(s.data(), [['Anna Hansen', 'Ja', 2, 'Glæder mig']]);
});

test('requires a first and last name', () => {
  const s = load();
  assert.deepEqual(s.post({ ...anna, name: 'Anna' }), { ok: false, error: 'full name required' });
  assert.deepEqual(s.post({ ...anna, name: '  Anna   ' }), { ok: false, error: 'full name required' });
  assert.deepEqual(s.data(), []);
});

test('refuses a name that is already on the list, ignoring case and extra spaces', () => {
  const s = load([[new Date(), 'Anna Hansen', 'Ja', 2, '']]);
  assert.deepEqual(s.post({ ...anna, name: '  anna   HANSEN ' }), { ok: false, error: 'duplicate' });
  assert.equal(s.data().length, 1);
});

test('updates the existing row instead of adding one when asked to', () => {
  const s = load([[new Date(2026, 0, 1), 'Anna Hansen', 'Ja', 2, 'Glæder mig'], [new Date(), 'Bo Berg', 'Nej', 0, '']]);
  assert.deepEqual(s.post({ name: 'anna hansen', attending: false, count: 0, message: 'Desværre', update: true }), { ok: true, updated: true });
  assert.deepEqual(s.data(), [
    ['anna hansen', 'Nej', 0, 'Desværre'],
    ['Bo Berg', 'Nej', 0, ''],
  ]);
  assert.ok(s.rows[1][0] > new Date(2026, 0, 1), 'timestamp is refreshed');
});

test('treats an update for a name that is not on the list as a new answer', () => {
  const s = load();
  assert.deepEqual(s.post({ ...anna, update: true }), { ok: true });
  assert.equal(s.data().length, 1);
});

test('still validates, escapes formulas and rejects bad input', () => {
  const s = load();
  assert.deepEqual(s.post({ ...anna, attending: 'yes' }), { ok: false, error: 'invalid attending' });
  assert.deepEqual(s.post({ ...anna, count: 0 }), { ok: false, error: 'invalid count' });
  assert.deepEqual(s.post({ ...anna, message: '=HYPERLINK("x")' }), { ok: true });
  assert.equal(s.data()[0][3], '\'=HYPERLINK("x")');
});
