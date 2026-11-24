// Run against the local frontend/backend: node backend/test/auth_page.test.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { poolPromise } = require('../src/config/db');

const script = fs.readFileSync(path.resolve(__dirname, '../../frontend/login.html'), 'utf8')
  .match(/<script>([\s\S]*?)<\/script>/)[1];
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
}

async function page(sessionStorage = storage()) {
  const elements = new Map();
  const alerts = [];
  let ready;
  const document = {
    addEventListener: (event, handler) => { if (event === 'DOMContentLoaded') ready = handler; },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, {
        value: '', checked: false, style: {}, classList: { add() {}, remove() {} }, handlers: {},
        addEventListener(event, handler) { this.handlers[event] = handler; },
        querySelector() { return this.button ||= { disabled: false, innerHTML: '' }; }
      });
      return elements.get(id);
    }
  };
  const context = vm.createContext({
    document, sessionStorage, localStorage: storage(), window: { location: { href: '' } },
    fetch: (url, options) => fetch(`http://127.0.0.1:3000${url}`, options)
  });
  vm.runInContext(script, context);
  context.showLuxuryAlert = options => alerts.push(options);
  await ready();
  return { context, alerts, element: id => document.getElementById(id), async submit(id) { await document.getElementById(id).handlers.submit({ preventDefault() {} }); } };
}

async function main() {
  const pool = await poolPromise;
  const email = `auth-regression-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  let testUserId;
  try {
    const registration = await page();
    for (const [id, value] of Object.entries({ 'reg-name': 'Auth Regression Test', 'reg-email': email, 'reg-password': password })) registration.element(id).value = value;
    await registration.submit('form-register');
    const user = JSON.parse(registration.context.sessionStorage.getItem('auralie_user'));
    testUserId = user?.id;
    assert.equal(user?.email, email);
    assert.equal(user?.role, 'CUSTOMER');
    assert.equal(registration.alerts.at(-1).redirectUrl, 'index.html');
    console.log('PASS: registration stores API user and shows success');

    const login = await page();
    login.element('login-email-input').value = email;
    login.element('login-password-input').value = password;
    await login.submit('form-login');
    assert.equal(JSON.parse(login.context.sessionStorage.getItem('auralie_user')).id, user.id);
    assert.equal(login.alerts.at(-1).redirectUrl, 'index.html');
    console.log('PASS: login stores API user and shows success');

    await registration.submit('form-register');
    assert.equal(registration.alerts.at(-1).title, 'Đăng Ký Thất Bại');
    console.log('PASS: duplicate email is rejected');

    const brokenSession = storage();
    brokenSession.setItem('auralie_token', login.context.sessionStorage.getItem('auralie_token'));
    brokenSession.setItem('auralie_user', 'undefined');
    const restored = await page(brokenSession);
    assert.equal(JSON.parse(brokenSession.getItem('auralie_user')).id, user.id);
    assert.equal(restored.context.window.location.href, 'index.html');
    console.log('PASS: interrupted session restores user from API');

    const expired = storage();
    expired.setItem('auralie_token', 'invalid-token');
    const cleared = await page(expired);
    assert.equal(expired.getItem('auralie_token'), null);
    assert.equal(typeof cleared.element('form-login').handlers.submit, 'function');
    console.log('PASS: invalid session allows login again');
  } finally {
    // Delete only this test's uniquely named account, even if an assertion failed.
    const request = pool.request().input('email', email);
    if (testUserId) request.input('id', testUserId);
    await request.query(`DELETE FROM users WHERE email = @email${testUserId ? ' AND id = @id' : ''}`);
    await pool.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
