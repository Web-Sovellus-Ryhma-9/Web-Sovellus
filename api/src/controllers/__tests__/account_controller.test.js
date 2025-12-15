import { login, register } from '../account_controller.js';
import * as accountModel from '../../models/account_model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.mock('../../models/account_model.js');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

function makeRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('account_controller.login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful login returns token and account', async () => {
    accountModel.findByUsernameOrEmail.mockResolvedValue({ account_id: 1, username: 'bob', email: 'b@a', password_hash: 'hashedpw' });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mocktoken');

    const req = { body: { identifier: 'bob', password: 'secret' } };
    const res = makeRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(accountModel.findByUsernameOrEmail).toHaveBeenCalledWith('bob');
    expect(bcrypt.compare).toHaveBeenCalledWith('secret', 'hashedpw');
    expect(jwt.sign).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Logged in', token: 'mocktoken', account: expect.any(Object) }));
  });

  test('login with unknown user returns 401', async () => {
    accountModel.findByUsernameOrEmail.mockResolvedValue(null);

    const req = { body: { identifier: 'nouser', password: 'x' } };
    const res = makeRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });

  test('login with wrong password returns 401', async () => {
    accountModel.findByUsernameOrEmail.mockResolvedValue({ account_id: 2, username: 'alice', email: 'a@b', password_hash: 'hashed' });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { identifier: 'alice', password: 'wrong' } };
    const res = makeRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(bcrypt.compare).toHaveBeenCalledWith('wrong', 'hashed');
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
  });
});

describe('account_controller.register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successful register returns created account', async () => {
    accountModel.findByUsername.mockResolvedValue(null);
    accountModel.findByEmail.mockResolvedValue(null);
    bcrypt.genSalt.mockResolvedValue('somesalt');
    bcrypt.hash.mockResolvedValue('hashedpw');
    accountModel.createAccount.mockResolvedValue({ account_id: 5, username: 'newuser', email: 'n@e' });

    const req = { body: { username: 'newuser', email: 'n@e', password: 'secret' } };
    const res = makeRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(accountModel.findByUsername).toHaveBeenCalledWith('newuser');
    expect(accountModel.findByEmail).toHaveBeenCalledWith('n@e');
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 'somesalt');
    expect(accountModel.createAccount).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Account created', account: expect.any(Object) }));
  });

  test('register fails when missing fields', async () => {
    const req = { body: { username: 'u', email: 'e' } };
    const res = makeRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing username, email or password' });
  });

  test('register fails when username exists', async () => {
    accountModel.findByUsername.mockResolvedValue({ account_id: 1 });

    const req = { body: { username: 'exists', email: 'x@x', password: 'p' } };
    const res = makeRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(accountModel.findByUsername).toHaveBeenCalledWith('exists');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Username already exists' });
  });

  test('register fails when email already registered', async () => {
    accountModel.findByUsername.mockResolvedValue(null);
    accountModel.findByEmail.mockResolvedValue({ account_id: 2 });

    const req = { body: { username: 'new', email: 'taken@e', password: 'p' } };
    const res = makeRes();
    const next = jest.fn();

    await register(req, res, next);

    expect(accountModel.findByEmail).toHaveBeenCalledWith('taken@e');
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
  });
});

describe('account_controller.deleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('deleteAccount succeeds with valid token', async () => {
    jwt.verify.mockReturnValue({ account_id: 42 });
    accountModel.deleteAccountById.mockResolvedValue({ account_id: 42 });

    const req = { headers: { authorization: 'Bearer sometoken' } };
    const res = makeRes();
    const next = jest.fn();

    const { deleteAccount } = await import('../account_controller.js');
    await deleteAccount(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('sometoken', expect.any(String));
    expect(accountModel.deleteAccountById).toHaveBeenCalledWith(42);
    expect(res.json).toHaveBeenCalledWith({ message: 'Account deleted' });
  });

  test('deleteAccount fails when Authorization header missing', async () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    const { deleteAccount } = await import('../account_controller.js');
    await deleteAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid authorization header' });
  });

  test('deleteAccount fails with invalid token', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = makeRes();
    const next = jest.fn();

    const { deleteAccount } = await import('../account_controller.js');
    await deleteAccount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  test('deleteAccount returns 404 when account not found', async () => {
    jwt.verify.mockReturnValue({ account_id: 99 });
    accountModel.deleteAccountById.mockResolvedValue(null);

    const req = { headers: { authorization: 'Bearer sometoken' } };
    const res = makeRes();
    const next = jest.fn();

    const { deleteAccount } = await import('../account_controller.js');
    await deleteAccount(req, res, next);

    expect(accountModel.deleteAccountById).toHaveBeenCalledWith(99);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Account not found' });
  });
});

describe('account_controller.logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('logout succeeds with valid token', async () => {
    jwt.verify.mockReturnValue({ account_id: 7 });

    const req = { headers: { authorization: 'Bearer goodtoken' } };
    const res = makeRes();
    const next = jest.fn();

    const { logout } = await import('../account_controller.js');
    await logout(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('goodtoken', expect.any(String));
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out' });
  });

  test('logout fails when Authorization header missing', async () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    const { logout } = await import('../account_controller.js');
    await logout(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid authorization header' });
  });

  test('logout fails with invalid token', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid'); });

    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = makeRes();
    const next = jest.fn();

    const { logout } = await import('../account_controller.js');
    await logout(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });
});
