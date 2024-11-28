import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getContactsDuration = new Trend('get_contacts', true);
export const successfulRequests = new Rate('successful_requests'); 

export const options = {
  thresholds: {
    successful_requests: ['rate>0.95'],
    http_req_duration: ['p(95)<5700'],
    http_req_failed: ['rate<0.12'],
    http_req_duration: ['avg<10000']
  },
  stages: [
    { duration: '20s', target: 10 },
    { duration: '60s', target: 10 },
    { duration: '20s', target: 75 },
    { duration: '60s', target: 75 },
    { duration: '20s', target: 175 },
    { duration: '60s', target: 175 },
    { duration: '30s', target: 300 },
    { duration: '30s', target: 300 },
]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  successfulRequests.add(res.status === OK);
  getContactsDuration.add(res.timings.duration);

  check(res, {
    'GET Contacts - Status 200': () => successfulRequests,
    'GET Contacts - Duração': () => getContactsDuration
  });
}
