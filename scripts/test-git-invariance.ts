import { execSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert';

console.log('=== EMPIRICAL TEST: Git Index Cache Invariance on SQLite Writes ===\n');

const dbPath = path.join(process.cwd(), 'data', 'oriental_serenity.db');
assert.ok(fs.existsSync(dbPath), `Database file must exist at ${dbPath}`);

const statBefore = fs.statSync(dbPath);
console.log(`Database before write: mtime=${statBefore.mtime.toISOString()}, size=${statBefore.size} bytes`);

// 1. Get git status before write
const statusBefore = execSync('git status --porcelain', { encoding: 'utf-8' });
console.log('Git status before write:\n' + (statusBefore.trim() || '(clean)'));

// 2. Perform intensive write operations to SQLite database
console.log('\nPerforming intensive write operations to SQLite database...');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('CREATE TABLE IF NOT EXISTS _test_git_invariance (id INTEGER PRIMARY KEY, note TEXT, ts TEXT);');
const insertStmt = db.prepare('INSERT INTO _test_git_invariance (note, ts) VALUES (?, ?);');
for (let i = 0; i < 20; i++) {
  insertStmt.run(`Stress test write ${i}`, new Date().toISOString());
}
db.exec('PRAGMA wal_checkpoint(FULL);');
// Drop the temporary table so we keep the DB clean
db.exec('DROP TABLE IF EXISTS _test_git_invariance;');
db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
db.close();

const statAfter = fs.statSync(dbPath);
console.log(`\nDatabase after write: mtime=${statAfter.mtime.toISOString()}, size=${statAfter.size} bytes`);
assert.notStrictEqual(statBefore.mtime.getTime(), statAfter.mtime.getTime(), 'Database mtime must have changed');

// 3. Get git status after write
const statusAfter = execSync('git status --porcelain', { encoding: 'utf-8' });
console.log('\nGit status after write:\n' + statusAfter);

// 4. Detailed assertions
const lines = statusAfter.split('\n').map(l => l.trim()).filter(Boolean);
const trackedDbModification = lines.find(l => l.includes('oriental_serenity.db') && !l.startsWith('D '));
const untrackedDbFile = lines.find(l => l.startsWith('??') && l.includes('oriental_serenity.db'));
const walOrShmFile = lines.find(l => l.includes('.db-wal') || l.includes('.db-shm'));

assert.ok(!trackedDbModification, `Violation: oriental_serenity.db appeared as tracked modification: ${trackedDbModification}`);
assert.ok(!untrackedDbFile, `Violation: oriental_serenity.db appeared as untracked file: ${untrackedDbFile}`);
assert.ok(!walOrShmFile, `Violation: WAL/SHM file appeared in git status: ${walOrShmFile}`);

console.log('✓ Invariance Verified: Database modifications did NOT appear in git status as tracked modifications or untracked files.');
console.log('=== GIT INDEX INVARIANCE TEST PASSED ===\n');
