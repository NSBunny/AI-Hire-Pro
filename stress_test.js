import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_EFIdWCp2OkU8@ep-nameless-math-apo3veaf-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 20, // max connection pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const BATCH_SIZE = 100;
const TOTAL_USERS = 5000;
const prefix = `stress_${Date.now()}`;

async function runStressTest() {
  console.log('========================================================');
  console.log('⚡ Starting Neon DB Scalability and Concurrency Stress Test ⚡');
  console.log('========================================================');
  console.log(`Connection URL: ${DATABASE_URL.split('@')[1]}`);
  console.log(`Target Load: ${TOTAL_USERS} employee operations`);
  console.log(`Pool Concurrency Limit: 20 active sockets`);
  console.log(`Batch Concurrency: ${BATCH_SIZE} parallel routines\n`);

  try {
    // ----------------------------------------------------
    // STAGE 1: Bulk Registration Ingestion
    // ----------------------------------------------------
    console.log('STAGE 1: Bulk Registering 5,000 employees...');
    const stage1Start = Date.now();
    const insertLatencies = [];
    
    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_USERS; j++) {
        const userId = i + j;
        const email = `${prefix}_emp_${userId}@stress.com`;
        const name = `Stress Employee ${userId}`;
        const pass = 'pass123';
        const role = 'employee';
        
        const singleStart = Date.now();
        batchPromises.push(
          pool.query(
            'INSERT INTO users (name, email, password, role, status) VALUES ($1, $2, $3, $4, $5)',
            [name, email, pass, role, 'active']
          ).then(() => {
            insertLatencies.push(Date.now() - singleStart);
          })
        );
      }
      await Promise.all(batchPromises);
      if ((i + BATCH_SIZE) % 1000 === 0) {
        console.log(` -> Ingested ${i + BATCH_SIZE} records...`);
      }
    }
    const stage1Duration = Date.now() - stage1Start;
    const avgInsertLatency = insertLatencies.reduce((a, b) => a + b, 0) / insertLatencies.length;
    console.log(`✅ Completed Ingestion of ${TOTAL_USERS} users in ${(stage1Duration / 1000).toFixed(2)}s.`);
    console.log(`   Throughput: ${(TOTAL_USERS / (stage1Duration / 1000)).toFixed(1)} operations/sec`);
    console.log(`   Average write latency: ${avgInsertLatency.toFixed(1)}ms\n`);

    // ----------------------------------------------------
    // STAGE 2: Real-time Concurrency Logins (Read performance)
    // ----------------------------------------------------
    console.log('STAGE 2: Simulating 5,000 parallel user login transactions...');
    const stage2Start = Date.now();
    const loginLatencies = [];

    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_USERS; j++) {
        const userId = i + j;
        const email = `${prefix}_emp_${userId}@stress.com`;
        const pass = 'pass123';
        
        const singleStart = Date.now();
        batchPromises.push(
          pool.query(
            'SELECT id, name, email, role FROM users WHERE email = $1 AND password = $2',
            [email, pass]
          ).then((res) => {
            loginLatencies.push(Date.now() - singleStart);
            if (res.rows.length === 0) {
              throw new Error(`Login failed for user ${email}`);
            }
          })
        );
      }
      await Promise.all(batchPromises);
    }
    const stage2Duration = Date.now() - stage2Start;
    
    // Calculate percentiles
    loginLatencies.sort((a, b) => a - b);
    const avgLogin = loginLatencies.reduce((a, b) => a + b, 0) / loginLatencies.length;
    const p50 = loginLatencies[Math.floor(loginLatencies.length * 0.5)];
    const p90 = loginLatencies[Math.floor(loginLatencies.length * 0.9)];
    const p95 = loginLatencies[Math.floor(loginLatencies.length * 0.95)];
    const p99 = loginLatencies[Math.floor(loginLatencies.length * 0.99)];
    
    console.log(`✅ Simulated ${TOTAL_USERS} login sessions in ${(stage2Duration / 1000).toFixed(2)}s.`);
    console.log(`   Throughput: ${(TOTAL_USERS / (stage2Duration / 1000)).toFixed(1)} logins/sec`);
    console.log(`   Avg latency: ${avgLogin.toFixed(1)}ms`);
    console.log(`   p50 (Median): ${p50}ms | p90: ${p90}ms | p95: ${p95}ms | p99: ${p99}ms\n`);

    // ----------------------------------------------------
    // STAGE 3: High Write-Volume Check-In Attendance Logging
    // ----------------------------------------------------
    console.log('STAGE 3: Simulating 5,000 real-time employee check-in logs...');
    const stage3Start = Date.now();
    const checkinLatencies = [];

    for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE) {
      const batchPromises = [];
      for (let j = 0; j < BATCH_SIZE && (i + j) < TOTAL_USERS; j++) {
        const userId = i + j;
        const recordId = `${prefix}_att_${userId}`;
        const dateStr = new Date().toISOString().split('T')[0];
        
        const singleStart = Date.now();
        batchPromises.push(
          pool.query(
            'INSERT INTO attendance (id, date, check_in, check_out, status) VALUES ($1, $2, $3, $4, $5)',
            [recordId, dateStr, '09:00 AM', null, 'Present']
          ).then(() => {
            checkinLatencies.push(Date.now() - singleStart);
          })
        );
      }
      await Promise.all(batchPromises);
    }
    const stage3Duration = Date.now() - stage3Start;
    const avgCheckin = checkinLatencies.reduce((a, b) => a + b, 0) / checkinLatencies.length;
    console.log(`✅ Clocked check-in attendance for ${TOTAL_USERS} employees in ${(stage3Duration / 1000).toFixed(2)}s.`);
    console.log(`   Throughput: ${(TOTAL_USERS / (stage3Duration / 1000)).toFixed(1)} check-ins/sec`);
    console.log(`   Avg write latency: ${avgCheckin.toFixed(1)}ms\n`);

    // ----------------------------------------------------
    // STAGE 4: Database Clean-up
    // ----------------------------------------------------
    console.log('STAGE 4: Cleaning up mock stress-test logs...');
    const cleanupStart = Date.now();
    const delUsers = await pool.query('DELETE FROM users WHERE email LIKE $1', [`${prefix}%`]);
    const delAtt = await pool.query('DELETE FROM attendance WHERE id LIKE $1', [`${prefix}%`]);
    console.log(`✅ Removed ${delUsers.rowCount} stress users and ${delAtt.rowCount} check-in logs in ${Date.now() - cleanupStart}ms.\n`);

    // ----------------------------------------------------
    // STAGE 5: Telemetry Summary Report
    // ----------------------------------------------------
    console.log('========================================================');
    console.log('📊 TELEMETRY PERFORMANCE SUMMARY REPORT');
    console.log('========================================================');
    console.log(`Total Simulated Transactions : ${TOTAL_USERS * 3} ops`);
    console.log(`DB Write Throughput          : ${(TOTAL_USERS / (stage1Duration / 1000)).toFixed(1)} inserts/sec`);
    console.log(`DB Read Query Throughput     : ${(TOTAL_USERS / (stage2Duration / 1000)).toFixed(1)} selects/sec`);
    console.log(`Average Query Latency (Read) : ${avgLogin.toFixed(1)}ms`);
    console.log(`p95 Latency Threshold (Read) : ${p95}ms`);
    console.log(`p99 Latency Threshold (Read) : ${p99}ms`);
    console.log(`Average Query Latency (Write): ${avgCheckin.toFixed(1)}ms`);
    console.log('--------------------------------------------------------');
    console.log('💡 Architectural Scalability Recommendations:');
    console.log(' 1. Enforce B-Tree Indexes on users(email, password) to reduce linear scanning.');
    console.log(' 2. Implement Redis caching layers for user login records to completely eliminate db round-trips.');
    console.log(' 3. Scale connection pool configurations from pg-pool max: 20 to 100-200 with connection pooling middlewares.');
    console.log('========================================================');

  } catch (err) {
    console.error('❌ Stress testing failed due to exception:', err);
  } finally {
    await pool.end();
    console.log('Stress testing database pool closed.');
  }
}

runStressTest().catch(console.error);
