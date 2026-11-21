const { test } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { crearApp, VERSION } = require('../src/app');

const app = crearApp();

test('GET /health responde ok', async () => {
  const res = await request(app).get('/health');
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { estado: 'ok' });
});

test('GET /api/info devuelve la versión de la app', async () => {
  const res = await request(app).get('/api/info');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.version, VERSION);
  assert.ok(res.body.commit);
});

test('GET /api/saludo/:nombre saluda por nombre', async () => {
  const res = await request(app).get('/api/saludo/Daniel');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.saludo, 'Hola, Daniel');
});

test('GET / sirve la página principal', async () => {
  const res = await request(app).get('/');
  assert.strictEqual(res.status, 200);
  assert.match(res.text, /CodePipeline/);
});

test('Ruta inexistente responde 404', async () => {
  const res = await request(app).get('/no-existe');
  assert.strictEqual(res.status, 404);
});
