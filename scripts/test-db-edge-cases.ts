import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { getDb } from '../src/lib/db';

console.log('=== EMPIRICAL TEST: DATABASE_PATH & resolveDbPath Edge Cases ===\n');

const originalEnvDbPath = process.env.DATABASE_PATH;
const originalEnvDbName = process.env.DATABASE_NAME;
const cwd = process.cwd();

try {
  // Test 1: DATABASE_PATH undefined, DATABASE_NAME undefined
  delete process.env.DATABASE_PATH;
  delete process.env.DATABASE_NAME;
  const db1 = getDb();
  assert.ok(db1, 'getDb() must return a database instance');
  const globalAny = globalThis as any;
  const expectedDefault = path.join(cwd, 'data', 'oriental_serenity.db');
  assert.strictEqual(globalAny.__sqliteDbPath, expectedDefault, `Expected ${expectedDefault}, got ${globalAny.__sqliteDbPath}`);
  console.log('✓ Test 1 Passed: DATABASE_PATH undefined resolves to data/oriental_serenity.db');

  // Test 2: DATABASE_PATH undefined, DATABASE_NAME set
  process.env.DATABASE_NAME = 'custom_name.db';
  delete process.env.DATABASE_PATH;
  const expectedCustomName = path.join(cwd, 'data', 'custom_name.db');
  // Need to trigger getDb() - but globalForDb.__sqliteDbPath was expectedDefault, so it should reinitialize
  const db2 = getDb();
  assert.strictEqual(globalAny.__sqliteDbPath, expectedCustomName, `Expected ${expectedCustomName}, got ${globalAny.__sqliteDbPath}`);
  console.log('✓ Test 2 Passed: DATABASE_NAME overrides default filename when DATABASE_PATH undefined');

  // Test 3: DATABASE_PATH is empty string ("")
  process.env.DATABASE_PATH = '';
  delete process.env.DATABASE_NAME;
  const db3 = getDb();
  assert.strictEqual(globalAny.__sqliteDbPath, expectedDefault, `Expected ${expectedDefault}, got ${globalAny.__sqliteDbPath}`);
  console.log('✓ Test 3 Passed: DATABASE_PATH="" safely falls back to default without error');

  // Test 4: DATABASE_PATH is relative path in nested directory
  const tempNestedDb = path.join('data', 'temp_challenge_edge', 'test_edge.db');
  process.env.DATABASE_PATH = tempNestedDb;
  const db4 = getDb();
  const expectedNested = path.resolve(cwd, tempNestedDb);
  assert.strictEqual(globalAny.__sqliteDbPath, expectedNested, `Expected ${expectedNested}, got ${globalAny.__sqliteDbPath}`);
  assert.ok(fs.existsSync(expectedNested), 'Nested directory and DB file must be created automatically');

  // Verify PRAGMAs on db4
  const walRow = db4.prepare('PRAGMA journal_mode;').get() as { journal_mode: string };
  assert.strictEqual(walRow.journal_mode.toLowerCase(), 'wal', 'journal_mode must be WAL');

  const busyTimeoutRow = db4.prepare('PRAGMA busy_timeout;').get() as { timeout: number };
  assert.strictEqual(busyTimeoutRow.timeout, 5000, 'busy_timeout must be 5000');

  const fkRow = db4.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number };
  assert.strictEqual(fkRow.foreign_keys, 1, 'foreign_keys must be ON (1)');

  // Verify schema initialization
  const tables = db4.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='rooms';").all();
  assert.strictEqual(tables.length, 1, 'Table rooms must be initialized');
  console.log('✓ Test 4 Passed: DATABASE_PATH with nested directory resolves, creates directory, sets WAL & inits schema');

  // Test 5: Switching back to default
  delete process.env.DATABASE_PATH;
  delete process.env.DATABASE_NAME;
  const db5 = getDb();
  assert.strictEqual(globalAny.__sqliteDbPath, expectedDefault);
  console.log('✓ Test 5 Passed: Switched back to default DB cleanly');

  // Cleanup temp files
  try {
    db4.close();
  } catch {}
  const tempDir = path.join(cwd, 'data', 'temp_challenge_edge');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }

  console.log('\n=== ALL DATABASE_PATH EDGE CASE TESTS PASSED ===');
} finally {
  if (originalEnvDbPath !== undefined) process.env.DATABASE_PATH = originalEnvDbPath;
  else delete process.env.DATABASE_PATH;
  if (originalEnvDbName !== undefined) process.env.DATABASE_NAME = originalEnvDbName;
  else delete process.env.DATABASE_NAME;
}
