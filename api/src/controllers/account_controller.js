import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createAccount, findByUsername, findByEmail, findByUsernameOrEmail, deleteAccountById, updateAvatar, findById } from "../models/account_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";
const ALLOWED_AVATARS = [
  "avatars/avatar1.png",
  "avatars/avatar2.png",
  "avatars/avatar3.png",
  "avatars/avatar4.png",
  "avatars/avatar5.png",
];

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing username, email or password" });
    }

    const existingUser = await findByUsername(username);
    if (existingUser) return res.status(409).json({ error: "Username already exists" });

    const existingEmail = await findByEmail(email);
    if (existingEmail) return res.status(409).json({ error: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const requestedAvatar = req.body?.avatar;
    const avatar = ALLOWED_AVATARS.includes(requestedAvatar) ? requestedAvatar : ALLOWED_AVATARS[0];

    const user = await createAccount(username, email, password_hash, avatar);

    res.status(201).json({ message: "Account created", account: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { identifier, password } = req.body; // identifier = username or email
    if (!identifier || !password) return res.status(400).json({ error: "Missing credentials" });

    const user = await findByUsernameOrEmail(identifier);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ account_id: user.account_id, username: user.username }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ message: "Logged in", token, account: { account_id: user.account_id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = parts[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const account_id = decoded.account_id;
    if (!account_id) return res.status(400).json({ error: "Invalid token payload" });

    const deleted = await deleteAccountById(account_id);
    if (!deleted) return res.status(404).json({ error: "Account not found" });

    res.json({ message: "Account deleted" });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = parts[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (!decoded || !decoded.account_id) return res.status(400).json({ error: "Invalid token payload" });
      // Stateless JWTs cannot be invalidated here without a blacklist; just acknowledge logout.
      return res.json({ message: "Logged out" });
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  } catch (err) {
    next(err);
  }
}

export async function changeAvatar(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    let decoded;
    try {
      decoded = jwt.verify(parts[1], JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { avatar } = req.body || {};
    if (!avatar || !ALLOWED_AVATARS.includes(avatar)) {
      return res.status(400).json({ error: "Invalid avatar choice" });
    }

    const updated = await updateAvatar(decoded.account_id, avatar);
    if (!updated) return res.status(404).json({ error: "Account not found" });

    const fresh = await findById(decoded.account_id);
    res.json({ message: "Avatar updated", account: fresh });
  } catch (err) {
    next(err);
  }
}
