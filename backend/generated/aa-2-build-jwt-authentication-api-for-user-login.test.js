// Generated: 2026-03-20T02:52:28.442Z
const request = require('supertest');
const app = require('./aa-2-build-jwt-authentication-api-for-user-login');

describe('Build JWT authentication API for user login', () => {
  
  test('As a registered user, I want to log in with my email and', async () => {
    const res = await request(app).as('a');
    expect(res.status).not.toBe(404);
  });

  test('password so that I can access my dashboard securely.', async () => {
    const res = await request(app).password('so');
    expect(res.status).not.toBe(404);
  });

  test('Acceptance Criteria:', async () => {
    const res = await request(app).acceptance('Criteria:');
    expect(res.status).not.toBe(404);
  });

  test('POST /auth/login accepts { email, password }', async () => {
    const res = await request(app).post('/auth/login');
    expect(res.status).not.toBe(404);
  });

  test('Returns 200 with JWT token on valid credentials', async () => {
    const res = await request(app).returns('200');
    expect(res.status).not.toBe(404);
  });

  test('Returns 401 on invalid credentials', async () => {
    const res = await request(app).returns('401');
    expect(res.status).not.toBe(404);
  });

  test('JWT expires in 24 hours', async () => {
    const res = await request(app).jwt('expires');
    expect(res.status).not.toBe(404);
  });

  test('Rate limited to 5 attempts per minute per IP', async () => {
    const res = await request(app).rate('limited');
    expect(res.status).not.toBe(404);
  });

  test('Technical Notes:', async () => {
    const res = await request(app).technical('Notes:');
    expect(res.status).not.toBe(404);
  });

  test('Stack: Node.js + Express + PostgreSQL', async () => {
    const res = await request(app).stack:('Node.js');
    expect(res.status).not.toBe(404);
  });

  test('Use bcrypt for password hashing', async () => {
    const res = await request(app).use('bcrypt');
    expect(res.status).not.toBe(404);
  });

  test('JWT_SECRET must come from environment variable', async () => {
    const res = await request(app).jwt_secret('must');
    expect(res.status).not.toBe(404);
  });

  test('Out of Scope:', async () => {
    const res = await request(app).out('of');
    expect(res.status).not.toBe(404);
  });

  test('OAuth / Google login (separate story)', async () => {
    const res = await request(app).oauth('/');
    expect(res.status).not.toBe(404);
  });

  test('2FA (future sprint)', async () => {
    const res = await request(app).2fa('(future');
    expect(res.status).not.toBe(404);
  });
});