// Generated: 2026-03-20T01:03:01.679Z
```javascript
const request = require('supertest');
const app = require('../app'); // Assuming your Express.js app is in a separate file

describe('/health endpoint', () => {
  it('returns status OK with 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  it('response body contains {"status": "ok"}', async () => {
    const response = await request(app).get('/health');
    expect(response.body).toEqual({ status: 'ok' });
  });
});
```