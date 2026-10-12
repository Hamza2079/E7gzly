import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const APP_URL = __ENV.URL || 'http://localhost:3000';

const errorRate = new Rate('errors');
const pageLoad = new Trend('page_load_time');

export const options = {
  stages: [
    { duration: '5m', target: 1000 },  // ramp up to 1000 users
    { duration: '10m', target: 1000 },  // stay at 1000
    { duration: '5m', target: 2000 },   // ramp up to 2000
    { duration: '10m', target: 2000 },  // stay at 2000
    { duration: '5m', target: 0 },      // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  group('Public Pages', function () {
    // Landing page
    var res = http.get(APP_URL + '/');
    check(res, { 'homepage status OK': function(r) { return r.status === 200; } });
    errorRate.add(res.status !== 200);
    pageLoad.add(res.timings.duration);
    sleep(1);

    // Login page
    res = http.get(APP_URL + '/login');
    check(res, { 'login page OK': function(r) { return r.status === 200; } });
    errorRate.add(res.status !== 200);
    sleep(1);
  });

  group('Doctor Directory', function () {
    // Doctor listing (heaviest page - 5+ Supabase queries)
    var res = http.get(APP_URL + '/doctors');
    check(res, { 'doctors list OK': function(r) { return r.status === 200; } });
    errorRate.add(res.status !== 200);
    pageLoad.add(res.timings.duration);
    sleep(2);

    // Doctor detail page
    res = http.get(APP_URL + '/doctors/d21282eb-904e-43b7-8183-5a8c2412787b');
    check(res, { 'doctor profile OK': function(r) { return r.status === 200; } });
    errorRate.add(res.status !== 200);
    pageLoad.add(res.timings.duration);
    sleep(2);
  });

  group('Register Page', function () {
    var res = http.get(APP_URL + '/register');
    check(res, { 'register page OK': function(r) { return r.status === 200; } });
    errorRate.add(res.status !== 200);
    sleep(1);
  });
}
