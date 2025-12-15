import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const apiRequests = new Counter('api_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Warm up
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '2m', target: 20 },   // Stay at 20 users
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    // 95% of requests should be below 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate should be below 5%
    errors: ['rate<0.05'],
    // 99% of requests should be below 1000ms
    'http_req_duration{name:health}': ['p(99)<1000'],
    // API response time average should be below 300ms
    api_response_time: ['avg<300', 'p(95)<500'],
  },
};

// Base URLs - customize for your environment
const BASE_API_URL = __ENV.API_URL || 'http://localhost:5271';
const BASE_CLIENT_URL = __ENV.CLIENT_URL || 'http://localhost:3000';

// Test scenarios
export default function () {
  // Group: Health Check Tests
  group('Health Checks', function () {
    const healthResponse = http.get(`${BASE_API_URL}/health`, {
      tags: { name: 'health' },
    });
    
    apiRequests.add(1);
    apiResponseTime.add(healthResponse.timings.duration);
    
    check(healthResponse, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
    
    sleep(1);
  });
  
  // Group: API Version Test
  group('Version API', function () {
    const versionResponse = http.get(`${BASE_API_URL}/api/version/current`, {
      tags: { name: 'version' },
    });
    
    apiRequests.add(1);
    apiResponseTime.add(versionResponse.timings.duration);
    
    check(versionResponse, {
      'version status is 200': (r) => r.status === 200,
      'version has valid format': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body && body.version;
        } catch (e) {
          return false;
        }
      },
    }) || errorRate.add(1);
    
    sleep(1);
  });
  
  // Group: Frontend Tests
  group('Frontend Pages', function () {
    const homeResponse = http.get(BASE_CLIENT_URL, {
      tags: { name: 'home' },
    });
    
    check(homeResponse, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage loads quickly': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);
    
    sleep(2);
  });
  
  // Group: Swagger Documentation
  group('API Documentation', function () {
    const swaggerResponse = http.get(`${BASE_API_URL}/swagger/index.html`, {
      tags: { name: 'swagger' },
    });
    
    check(swaggerResponse, {
      'swagger is accessible': (r) => r.status === 200,
    }) || errorRate.add(1);
    
    sleep(1);
  });
}

// Setup function - runs once before tests
export function setup() {
  console.log('🏁 Starting Turn One Performance Tests');
  console.log(`API URL: ${BASE_API_URL}`);
  console.log(`Client URL: ${BASE_CLIENT_URL}`);
  
  // Verify services are up
  const healthCheck = http.get(`${BASE_API_URL}/health`);
  if (healthCheck.status !== 200) {
    console.error('❌ API health check failed!');
    throw new Error('API is not responding');
  }
  
  console.log('✅ Services are healthy');
  return { timestamp: new Date().toISOString() };
}

// Teardown function - runs once after tests
export function teardown(data) {
  console.log('✅ Tests completed at:', data.timestamp);
  console.log('📊 Check the metrics above for detailed results');
}

// Handle summary
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;
  
  let summary = '\n';
  summary += `${indent}🏎️  Turn One Performance Test Results\n`;
  summary += `${indent}═══════════════════════════════════════\n\n`;
  
  // Metrics
  if (data.metrics) {
    summary += `${indent}📊 Key Metrics:\n`;
    
    if (data.metrics.http_reqs) {
      summary += `${indent}  Total Requests: ${data.metrics.http_reqs.values.count}\n`;
    }
    
    if (data.metrics.http_req_duration) {
      const duration = data.metrics.http_req_duration.values;
      summary += `${indent}  Avg Response Time: ${duration.avg.toFixed(2)}ms\n`;
      summary += `${indent}  95th Percentile: ${duration['p(95)'].toFixed(2)}ms\n`;
      summary += `${indent}  99th Percentile: ${duration['p(99)'].toFixed(2)}ms\n`;
    }
    
    if (data.metrics.errors) {
      const errorPct = (data.metrics.errors.values.rate * 100).toFixed(2);
      summary += `${indent}  Error Rate: ${errorPct}%\n`;
    }
    
    if (data.metrics.http_req_failed) {
      const failedPct = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
      summary += `${indent}  Failed Requests: ${failedPct}%\n`;
    }
  }
  
  summary += '\n';
  
  // Checks
  if (data.root_group && data.root_group.checks) {
    const checks = data.root_group.checks;
    const passed = checks.filter(c => c.passes > 0).length;
    const total = checks.length;
    
    summary += `${indent}✅ Checks: ${passed}/${total} passed\n\n`;
  }
  
  // Thresholds
  if (data.thresholds) {
    summary += `${indent}🎯 Thresholds:\n`;
    Object.keys(data.thresholds).forEach(key => {
      const threshold = data.thresholds[key];
      const status = threshold.ok ? '✅' : '❌';
      summary += `${indent}  ${status} ${key}\n`;
    });
  }
  
  return summary;
}
