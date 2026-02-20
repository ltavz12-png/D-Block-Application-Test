/**
 * D Block Workspace — k6 Load Test Suite
 *
 * Run with:
 *   k6 run k6/load-test.js
 *   k6 run --vus 100 --duration 60s k6/load-test.js
 *   k6 run --env BASE_URL=https://api.dblock.ge k6/load-test.js
 *
 * Install k6:
 *   brew install k6    (macOS)
 *   apt install k6     (Linux)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ─────────────────────────────────────────────────
const errorRate = new Rate('errors');
const bookingDuration = new Trend('booking_flow_duration');
const authDuration = new Trend('auth_flow_duration');
const apiCalls = new Counter('api_calls');

// ─── Configuration ──────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API = `${BASE_URL}/api/v1`;

export const options = {
  stages: [
    // Ramp up
    { duration: '30s', target: 50 },   // Ramp to 50 users
    { duration: '1m', target: 100 },   // Ramp to 100 users
    { duration: '2m', target: 200 },   // Ramp to 200 users
    { duration: '3m', target: 500 },   // Peak: 500 concurrent users
    { duration: '2m', target: 500 },   // Sustain peak
    { duration: '1m', target: 100 },   // Ramp down
    { duration: '30s', target: 0 },    // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'],                    // Error rate < 1%
    errors: ['rate<0.05'],                             // Custom error rate < 5%
    booking_flow_duration: ['p(95)<2000'],             // Booking flow < 2s at p95
    auth_flow_duration: ['p(95)<500'],                 // Auth flow < 500ms at p95
  },
};

// ─── Test Data ──────────────────────────────────────────────────────
const TEST_USER = {
  email: `loadtest+${Date.now()}@dblock.ge`,
  password: 'LoadTest123!',
  firstName: 'Load',
  lastName: 'Tester',
};

const LOCATION_IDS = [
  'stamba-location-uuid',      // Replace with real UUIDs
  'radio-city-location-uuid',
  'batumi-location-uuid',
];

// ─── Helper Functions ───────────────────────────────────────────────
function getHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function randomLocationId() {
  return LOCATION_IDS[Math.floor(Math.random() * LOCATION_IDS.length)];
}

function randomDate(daysAhead = 30) {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead) + 1);
  return date.toISOString().split('T')[0];
}

// ─── Auth Flow ──────────────────────────────────────────────────────
function authFlow() {
  let token = null;

  group('Authentication', () => {
    const start = Date.now();

    // Register
    const registerRes = http.post(
      `${API}/auth/register`,
      JSON.stringify({
        email: `loadtest+${__VU}-${__ITER}@dblock.ge`,
        password: TEST_USER.password,
        firstName: TEST_USER.firstName,
        lastName: TEST_USER.lastName,
      }),
      { headers: getHeaders() },
    );

    apiCalls.add(1);

    const registerOk = check(registerRes, {
      'register status 201': (r) => r.status === 201,
      'register has token': (r) => {
        try {
          return JSON.parse(r.body).data?.accessToken !== undefined;
        } catch {
          return false;
        }
      },
    });

    if (registerOk) {
      try {
        token = JSON.parse(registerRes.body).data.accessToken;
      } catch {
        // Use login fallback
      }
    }

    // Login (if register returned existing user)
    if (!token) {
      const loginRes = http.post(
        `${API}/auth/login`,
        JSON.stringify({
          email: `loadtest+${__VU}-${__ITER}@dblock.ge`,
          password: TEST_USER.password,
        }),
        { headers: getHeaders() },
      );

      apiCalls.add(1);

      check(loginRes, {
        'login status 200': (r) => r.status === 200,
        'login has token': (r) => {
          try {
            return JSON.parse(r.body).data?.accessToken !== undefined;
          } catch {
            return false;
          }
        },
      });

      try {
        token = JSON.parse(loginRes.body).data.accessToken;
      } catch {
        errorRate.add(1);
      }
    }

    authDuration.add(Date.now() - start);
  });

  return token;
}

// ─── Main Scenarios ─────────────────────────────────────────────────

export default function () {
  const token = authFlow();
  if (!token) {
    errorRate.add(1);
    return;
  }

  // Scenario 1: Browse locations and resources (most common)
  group('Browse Locations & Resources', () => {
    // List locations
    const locationsRes = http.get(`${API}/locations`, {
      headers: getHeaders(token),
    });
    apiCalls.add(1);
    check(locationsRes, {
      'locations status 200': (r) => r.status === 200,
      'locations has data': (r) => {
        try {
          return Array.isArray(JSON.parse(r.body).data);
        } catch {
          return false;
        }
      },
    });

    sleep(0.5);

    // List resources for a location
    const resourcesRes = http.get(
      `${API}/resources?locationId=${randomLocationId()}&page=1&limit=20`,
      { headers: getHeaders(token) },
    );
    apiCalls.add(1);
    check(resourcesRes, {
      'resources status 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // Scenario 2: Booking flow (critical path)
  group('Booking Flow', () => {
    const start = Date.now();

    // Check availability
    const availabilityRes = http.get(
      `${API}/bookings/availability?resourceId=test-resource-uuid&date=${randomDate()}`,
      { headers: getHeaders(token) },
    );
    apiCalls.add(1);
    check(availabilityRes, {
      'availability status 200': (r) => r.status === 200,
    });

    sleep(0.5);

    // Create booking
    const createRes = http.post(
      `${API}/bookings`,
      JSON.stringify({
        resourceId: 'test-resource-uuid',
        startDate: randomDate(),
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Load test booking',
      }),
      { headers: getHeaders(token) },
    );
    apiCalls.add(1);
    check(createRes, {
      'create booking status 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    // List my bookings
    const myBookingsRes = http.get(`${API}/bookings/my?page=1&limit=10`, {
      headers: getHeaders(token),
    });
    apiCalls.add(1);
    check(myBookingsRes, {
      'my bookings status 200': (r) => r.status === 200,
    });

    bookingDuration.add(Date.now() - start);
    sleep(1);
  });

  // Scenario 3: Visitor management
  group('Visitor Management', () => {
    // Invite a visitor
    const inviteRes = http.post(
      `${API}/visitors`,
      JSON.stringify({
        locationId: randomLocationId(),
        visitorName: `Visitor ${__VU}-${__ITER}`,
        visitorEmail: `visitor-${__VU}@example.com`,
        expectedDate: randomDate(7),
        purpose: 'Meeting',
      }),
      { headers: getHeaders(token) },
    );
    apiCalls.add(1);
    check(inviteRes, {
      'invite visitor status 2xx': (r) => r.status >= 200 && r.status < 300,
    });

    sleep(0.5);

    // List my visitors
    const myVisitorsRes = http.get(`${API}/visitors/my?page=1&limit=10`, {
      headers: getHeaders(token),
    });
    apiCalls.add(1);
    check(myVisitorsRes, {
      'my visitors status 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // Scenario 4: Notifications
  group('Notifications', () => {
    const notificationsRes = http.get(
      `${API}/notifications?page=1&limit=20`,
      { headers: getHeaders(token) },
    );
    apiCalls.add(1);
    check(notificationsRes, {
      'notifications status 200': (r) => r.status === 200,
    });

    // Unread count
    const unreadRes = http.get(`${API}/notifications/unread-count`, {
      headers: getHeaders(token),
    });
    apiCalls.add(1);
    check(unreadRes, {
      'unread count status 200': (r) => r.status === 200,
    });

    sleep(0.3);
  });

  // Scenario 5: User profile
  group('User Profile', () => {
    const profileRes = http.get(`${API}/auth/profile`, {
      headers: getHeaders(token),
    });
    apiCalls.add(1);
    check(profileRes, {
      'profile status 200': (r) => r.status === 200,
    });

    sleep(0.2);
  });

  // Random think time between iterations
  sleep(Math.random() * 3 + 1);
}

// ─── Lifecycle Hooks ────────────────────────────────────────────────

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalRequests: data.metrics.api_calls?.values?.count || 0,
    errorRate: data.metrics.errors?.values?.rate || 0,
    p95ResponseTime: data.metrics.http_req_duration?.values?.['p(95)'] || 0,
    p99ResponseTime: data.metrics.http_req_duration?.values?.['p(99)'] || 0,
    avgResponseTime: data.metrics.http_req_duration?.values?.avg || 0,
    bookingFlowP95: data.metrics.booking_flow_duration?.values?.['p(95)'] || 0,
    authFlowP95: data.metrics.auth_flow_duration?.values?.['p(95)'] || 0,
  };

  return {
    'k6/results/summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data) {
  return `
╔══════════════════════════════════════════════════════════════╗
║           D BLOCK WORKSPACE — LOAD TEST RESULTS             ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Total Requests:     ${String(data.metrics.api_calls?.values?.count || 0).padStart(8)}                          ║
║  Error Rate:         ${String((data.metrics.errors?.values?.rate * 100 || 0).toFixed(2) + '%').padStart(8)}                          ║
║  Avg Response:       ${String((data.metrics.http_req_duration?.values?.avg || 0).toFixed(0) + 'ms').padStart(8)}                          ║
║  p95 Response:       ${String((data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0) + 'ms').padStart(8)}                          ║
║  p99 Response:       ${String((data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0) + 'ms').padStart(8)}                          ║
║                                                              ║
║  Booking Flow p95:   ${String((data.metrics.booking_flow_duration?.values?.['p(95)'] || 0).toFixed(0) + 'ms').padStart(8)}                          ║
║  Auth Flow p95:      ${String((data.metrics.auth_flow_duration?.values?.['p(95)'] || 0).toFixed(0) + 'ms').padStart(8)}                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`;
}
