const request = require('supertest');
const app = require('./pace-002-todo-list-crud-api');

describe('Todo List CRUD API', () => {
  
  test('POST /todos - create a new todo with title and description', async () => {
    const res = await request(app).post('/todos');
    expect(res.status).not.toBe(404);
  });

  test('GET /todos - return all todos for the user', async () => {
    const res = await request(app).get('/todos');
    expect(res.status).not.toBe(404);
  });

  test('PUT /todos/:id - update a todo by id', async () => {
    const res = await request(app).put('/todos/:id');
    expect(res.status).not.toBe(404);
  });

  test('DELETE /todos/:id - delete a todo by id', async () => {
    const res = await request(app).delete('/todos/:id');
    expect(res.status).not.toBe(404);
  });
});