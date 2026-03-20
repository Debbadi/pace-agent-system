// Generated: 2026-03-20T02:51:03.070Z
const request = require('supertest');
const app = require('./aa-4-as-a-registered-user,-i-want-to-log-in-with-my-email-and-password-so-that-i-can-access-my-dashboard-securely.');

describe('As a registered user, I want to log in with my email and  password so that I can access my dashboard securely.', () => {
  
  test('As a registered user, I want to log in with my email and  password so that I can access my dashboard securely.', async () => {
    const res = await request(app).as('a');
    expect(res.status).not.toBe(404);
  });
});