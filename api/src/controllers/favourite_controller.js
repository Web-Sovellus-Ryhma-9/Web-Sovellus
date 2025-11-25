import jwt from "jsonwebtoken";
import {
  getFavoritesByAccount,
  addFavoriteToList,
  removeFavoriteFromList,
  getOrCreateDefaultListForAccount,
  findFavoriteByAccountAndMovie,
} from "../models/favourite_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function extractAccountId(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    return decoded.account_id;
  } catch (e) {
    return null;
  }
}

export async function getFavorites(req, res, next) {
  try {
    const account_id = extractAccountId(req);
    if (!account_id) return res.status(401).json({ error: "Unauthorized" });

    const rows = await getFavoritesByAccount(account_id);
    res.json(rows.map(r => ({ movie_id: r.movie_id, title: r.title })));
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req, res, next) {
  try {
    const account_id = extractAccountId(req);
    if (!account_id) return res.status(401).json({ error: "Unauthorized" });

    const { id: movie_id, title } = req.body;
    if (!movie_id) return res.status(400).json({ error: "Missing movie id" });

    // ensure default list exists for this account
    const list = await getOrCreateDefaultListForAccount(account_id);

    // avoid duplicate
    const existing = await findFavoriteByAccountAndMovie(account_id, movie_id);
    if (existing) return res.status(409).json({ error: "Already favourited" });

    const added = await addFavoriteToList(list.favourite_id, String(movie_id), title || null);
    // debug log
    console.log(`FAV ADD: account_id=${account_id} favourite_id=${list.favourite_id} movie_id=${movie_id}`);
    res.status(201).json({ message: "Added to favourites", favourite: added });
  } catch (err) {
    next(err);
  }
}

export async function deleteFavorite(req, res, next) {
  try {
    const account_id = extractAccountId(req);
    if (!account_id) return res.status(401).json({ error: "Unauthorized" });

    const movie_id = req.params.id;
    if (!movie_id) return res.status(400).json({ error: "Missing movie id" });

    const list = await getOrCreateDefaultListForAccount(account_id);
    const removed = await removeFavoriteFromList(list.favourite_id, String(movie_id));
    // debug log
    console.log(`FAV DEL: account_id=${account_id} favourite_id=${list.favourite_id} movie_id=${movie_id} removed=${!!removed}`);
    if (!removed) return res.status(404).json({ error: "Favourite not found" });
    res.json({ message: "Removed from favourites" });
  } catch (err) {
    next(err);
  }
}

// Debug: return all favourite items (no auth) — useful during development to inspect DB
export async function debugAllFavorites(req, res, next) {
  try {
    // lazy import to avoid circular issues
    const pool = (await import("../database.js")).default;
    const sql = `SELECT fi.id, fl.favourite_id, fl.account_id, fl.Movielist, fi.movie_id, fi.title FROM favourite_items fi JOIN favouritelist fl ON fi.favourite_id = fl.favourite_id ORDER BY fi.id DESC`;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
