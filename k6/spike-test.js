/**
 * D Block Workspace — k6 Spike Test
 *
 * Tests system behavior during sudden traffic spikes.
 * Simulates scenarios like:
 *   - Marketing campaign launch
 *   - Event announcement (all members booking at once)
 *   - Monday morning rush
 *
 * Run with:
 *   k6 run k6/spike-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API = `${BASE_URL}/api/v1`;

export const options = {
  stages: [
    { duration: '10s', target: 10 },    // Warm up
    { duration: '5s', target: 1000 },    // SPIKE! Instant jump to 1000
    { duration: '1m', target: 1000 },    // Sustain spike
    { duration: '5s', target: 10 },      // Rapid drop
    { duration: '30s', target: 10 },     // Recovery period
    { duration: '5s', target: 1000 },    // Second spike
    { duration: '1m', target: 1000 },    // Sustain
    { duration: '30s', target: 0 },      // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],   // Accept higher latency during spikes
    http_req_failed: ['rate<0.15'],       // Accept up to 15% failure during spikes
  },
};

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function () {
  // Quick login
  const loginRes = http.post(
    `${API}/auth/login`,
    JSON.stringify({
      email: `spiketest+${__VU % 50}@dblock.ge`,
      password: 'SpikeTest123!',
    }),
    { headers: getHeaders() },
  );

  let token;
  try {
    token = JSON.parse(loginRes.body).data?.accessToken;
  } catch {
    errorRate.add(1);
    return;
  }

  if (!token) {
    errorRate.add(1);
    return;
  }

  // Simulate "everyone checking availability at once"
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const dateStr = date.toISOString().split('T')[0];

  const responses = http.batch([
    ['GET', `${API}/resources?page=1&limit=50`, null, { headers: getHeaders(token) }],
    ['GET', `${API}/bookings/availability?date=${dateStr}`, null, { headers: getHeaders(token) }],
    ['GET', `${API}/locations`, null, { headers: getHeaders(token) }],
  ]);

  for (const res of responses) {
    const ok = check(res, {
      'status is not 5xx': (r) => r.status < 500,
    });
    if (!ok) errorRate.add(1);
  }

  sleep(Math.random() * 0.3);
}

export function handleSummary(data) {
  return {
    'k6/results/spike-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'spike-test',
      peakVUs: 1000,
      p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      errorRate: data.metrics.errors?.values?.rate || 0,
    }, null, 2),
    stdout: `\nSpike Test Complete\nError Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\np95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms\n`,
  };
}
