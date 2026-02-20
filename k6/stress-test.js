/**
 * D Block Workspace — k6 Stress Test
 *
 * Tests system behavior under extreme load and beyond normal capacity.
 * Identifies breaking points and degradation patterns.
 *
 * Run with:
 *   k6 run k6/stress-test.js
 *   k6 run --env BASE_URL=https://api.dblock.ge k6/stress-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTrend = new Trend('response_time');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API = `${BASE_URL}/api/v1`;

export const options = {
  stages: [
    // Ramp up aggressively
    { duration: '1m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },   // 2x peak capacity
    { duration: '3m', target: 1500 },   // 3x peak capacity — find breaking point
    { duration: '2m', target: 2000 },   // 4x peak capacity
    { duration: '2m', target: 500 },    // Recovery test
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Stress test thresholds are looser
    http_req_duration: ['p(95)<2000'],   // 95% under 2s even under stress
    http_req_failed: ['rate<0.10'],       // Up to 10% error rate acceptable
  },
};

function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function () {
  // Login
  const loginRes = http.post(
    `${API}/auth/login`,
    JSON.stringify({
      email: `stresstest+${__VU % 100}@dblock.ge`,
      password: 'StressTest123!',
    }),
    { headers: getHeaders() },
  );

  let token;
  try {
    token = JSON.parse(loginRes.body).data?.accessToken;
  } catch {
    errorRate.add(1);
    sleep(1);
    return;
  }

  if (!token) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  // Rapid-fire API calls (simulates heavy usage)
  const requests = [
    ['GET', `${API}/locations`],
    ['GET', `${API}/resources?page=1&limit=50`],
    ['GET', `${API}/bookings/my?page=1&limit=20`],
    ['GET', `${API}/notifications?page=1&limit=20`],
    ['GET', `${API}/visitors/my?page=1&limit=20`],
    ['GET', `${API}/auth/profile`],
  ];

  for (const [method, url] of requests) {
    const start = Date.now();
    const res = http.request(method, url, null, {
      headers: getHeaders(token),
    });
    responseTrend.add(Date.now() - start);

    check(res, {
      'status is not 5xx': (r) => r.status < 500,
    });

    if (res.status >= 500) {
      errorRate.add(1);
    }
  }

  // Concurrent booking attempts (contention test)
  group('Concurrent Bookings', () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const dateStr = date.toISOString().split('T')[0];

    const res = http.post(
      `${API}/bookings`,
      JSON.stringify({
        resourceId: 'shared-room-uuid',
        startDate: dateStr,
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Stress test concurrent booking',
      }),
      { headers: getHeaders(token) },
    );

    check(res, {
      'booking not 5xx': (r) => r.status < 500,
      'booking conflict handled': (r) => r.status !== 500,
    });
  });

  sleep(Math.random() * 0.5);
}

export function handleSummary(data) {
  return {
    'k6/results/stress-summary.json': JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'stress-test',
      maxVUs: 2000,
      p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
      p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
      errorRate: data.metrics.errors?.values?.rate || 0,
      httpFailRate: data.metrics.http_req_failed?.values?.rate || 0,
    }, null, 2),
    stdout: `\nStress Test Complete\nError Rate: ${((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\np95: ${(data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)}ms\n`,
  };
}
