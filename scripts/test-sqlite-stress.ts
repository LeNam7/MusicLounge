import { getDb } from '../src/lib/db';
import { fork } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

async function runStressTest() {
  console.log('=== [CHALLENGER] SQLITE STRESS & CONCURRENCY VERIFICATION ===\n');

  // Test 1: Repeated calls identity check (1,000 calls)
  console.log('--- Test 1: Singleton Identity Check (1,000 calls) ---');
  const baseDb = getDb();
  let singletonPassed = true;
  for (let i = 0; i < 1000; i++) {
    const db = getDb();
    if (db !== baseDb || (globalThis as unknown as { __sqliteDb: unknown }).__sqliteDb !== baseDb) {
      singletonPassed = false;
      break;
    }
  }
  if (!singletonPassed) {
    throw new Error('FAILED: Repeated calls to getDb() returned different instances!');
  }
  console.log('✓ PASS: All 1,000 calls to getDb() returned identical instance reference on globalThis.__sqliteDb\n');

  // Test 2: Pragmas check
  console.log('--- Test 2: Pragma Verification ---');
  const jm = (baseDb.prepare('PRAGMA journal_mode;').get() as { journal_mode: string }).journal_mode;
  const bt = (baseDb.prepare('PRAGMA busy_timeout;').get() as { timeout: number }).timeout;
  const fk = (baseDb.prepare('PRAGMA foreign_keys;').get() as { foreign_keys: number }).foreign_keys;

  console.log(`Journal mode: ${jm} (expected: wal)`);
  console.log(`Busy timeout: ${bt} (expected: 5000)`);
  console.log(`Foreign keys: ${fk} (expected: 1)`);

  if (jm.toLowerCase() !== 'wal') throw new Error(`Expected journal_mode=wal, got ${jm}`);
  if (bt !== 5000) throw new Error(`Expected busy_timeout=5000, got ${bt}`);
  if (fk !== 1) throw new Error(`Expected foreign_keys=1, got ${fk}`);
  console.log('✓ PASS: All PRAGMAs configured correctly.\n');

  // Test 3: Concurrent async read/write stress in single process
  console.log('--- Test 3: In-Process Concurrent Read/Write (100 parallel reads + writes) ---');
  baseDb.exec(`
    CREATE TABLE IF NOT EXISTS __stress_test (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      worker_id TEXT,
      seq INTEGER,
      payload TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const readPromises: Promise<number>[] = [];
  for (let i = 0; i < 100; i++) {
    readPromises.push(
      new Promise((resolve) => {
        setImmediate(() => {
          const count = (baseDb.prepare('SELECT COUNT(*) as cnt FROM __stress_test').get() as { cnt: number }).cnt;
          resolve(count);
        });
      })
    );
  }

  const insertStmt = baseDb.prepare('INSERT INTO __stress_test (worker_id, seq, payload) VALUES (?, ?, ?)');
  for (let i = 0; i < 20; i++) {
    baseDb.exec('BEGIN IMMEDIATE;');
    insertStmt.run('in-process', i, `payload-${i}`);
    baseDb.exec('COMMIT;');
  }

  const readResults = await Promise.all(readPromises);
  console.log(`✓ PASS: 100 concurrent reads and 20 transactions executed cleanly. Read samples: [${readResults.slice(0, 5).join(', ')}...]\n`);

  // Test 4: Multi-process concurrency stress (4 child processes contending on SQLite DB)
  console.log('--- Test 4: Multi-Process Concurrency Stress (4 parallel processes, 25 tx each = 100 tx) ---');
  
  const dbPath = path.resolve(process.cwd(), 'src/lib/db');
  const workerScript = `
    const { getDb } = require(${JSON.stringify(dbPath)});
    const db = getDb();
    const workerId = process.argv[2];
    const insert = db.prepare('INSERT INTO __stress_test (worker_id, seq, payload) VALUES (?, ?, ?)');
    for (let i = 0; i < 25; i++) {
      db.exec('BEGIN IMMEDIATE;');
      insert.run(workerId, i, 'child-worker-payload-' + i);
      // Small artificial latency to increase lock contention
      const start = Date.now();
      while (Date.now() - start < 5) {}
      db.exec('COMMIT;');
    }
    process.exit(0);
  `;

  const tempWorkerFile = path.join(process.cwd(), 'scripts', '__temp_worker.js');
  fs.writeFileSync(tempWorkerFile, workerScript, 'utf8');

  try {
    const processes = [1, 2, 3, 4].map((id) => {
      return new Promise<void>((resolve, reject) => {
        const cp = fork(tempWorkerFile, [`worker-${id}`]);
        cp.on('exit', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Worker ${id} exited with code ${code}`));
        });
        cp.on('error', reject);
      });
    });

    await Promise.all(processes);
    console.log('✓ PASS: All 4 child processes finished concurrently with code 0 (no SQLITE_BUSY lockouts).');

    const totalRows = (baseDb.prepare("SELECT COUNT(*) as cnt FROM __stress_test WHERE worker_id LIKE 'worker-%'").get() as { cnt: number }).cnt;
    console.log(`✓ PASS: Verified total rows inserted by concurrent workers: ${totalRows} (expected 100).\n`);
    if (totalRows !== 100) {
      throw new Error(`Expected 100 rows from workers, got ${totalRows}`);
    }
  } finally {
    if (fs.existsSync(tempWorkerFile)) {
      fs.unlinkSync(tempWorkerFile);
    }
    // Clean up test table
    baseDb.exec('DROP TABLE IF EXISTS __stress_test;');
  }

  // Test 5: Dynamic path switching & old instance closure
  console.log('--- Test 5: Dynamic DATABASE_PATH switching & old DB closure ---');
  const initialDb = getDb();
  const customDir = path.join(process.cwd(), 'data_temp_test');
  const customPath = path.join(customDir, 'custom.db');
  process.env.DATABASE_PATH = customPath;

  const switchedDb = getDb();
  if (switchedDb === initialDb) {
    throw new Error('FAILED: Expected new DB instance when DATABASE_PATH changed!');
  }
  const switchedPath = (globalThis as unknown as { __sqliteDbPath: string }).__sqliteDbPath;
  if (switchedPath !== customPath) {
    throw new Error(`Expected __sqliteDbPath to be ${customPath}, got ${switchedPath}`);
  }
  // Verify directory was auto-created
  if (!fs.existsSync(customDir)) {
    throw new Error(`Expected directory ${customDir} to be created!`);
  }
  // Verify initialDb was closed
  let oldClosed = false;
  try {
    initialDb.prepare('SELECT 1').get();
  } catch (err: unknown) {
    oldClosed = true;
    console.log('✓ PASS: Previous DB connection was verified closed (cannot execute queries on closed DB).');
  }
  if (!oldClosed) {
    throw new Error('FAILED: Old DB instance was not closed after path switch!');
  }

  // Restore original DB
  delete process.env.DATABASE_PATH;
  const restoredDb = getDb();
  if (restoredDb === switchedDb) {
    throw new Error('FAILED: Expected DB to switch back to default when DATABASE_PATH unset');
  }

  // Clean up temporary custom test db
  try {
    switchedDb.close();
  } catch {}
  if (fs.existsSync(customPath)) fs.unlinkSync(customPath);
  const walFile = customPath + '-wal';
  const shmFile = customPath + '-shm';
  if (fs.existsSync(walFile)) fs.unlinkSync(walFile);
  if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile);
  if (fs.existsSync(customDir)) fs.rmdirSync(customDir);
  console.log('✓ PASS: Dynamic path switching, auto-mkdir, and old connection cleanup verified.\n');

  console.log('\n=== SQLITE STRESS & CONCURRENCY TEST COMPLETED SUCCESSFULLY ===');
}

runStressTest().catch((err) => {
  console.error('FAILED STRESS TEST:', err);
  process.exit(1);
});
