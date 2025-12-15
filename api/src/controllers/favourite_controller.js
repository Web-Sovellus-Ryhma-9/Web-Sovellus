import jwt from "jsonwebtoken";
import {
  getFavoritesByAccount,
  addFavoriteToList,
  removeFavoriteFromList,
  getOrCreateDefaultListForAccount,
  findFavoriteByAccountAndMovie,
  getFavoritesByListId,
} from "../models/favourite_model.js";
import { getMovieDetails, getTvDetails } from "../models/tmdb_model.js";

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
    const items = await Promise.all(rows.map(async (r) => {
      // Decode media_type from stored movie_id (format: "tv:123" or "movie:456")
      let id = r.movie_id;
      let media_type = 'movie';
      
      const parts = String(id).split(':');
      if (parts.length === 2 && (parts[0] === 'tv' || parts[0] === 'movie')) {
        media_type = parts[0];
        id = parts[1];
      } else {
        // Fallback to detection for old stored data
        try {
          await getMovieDetails(id);
          media_type = 'movie';
        } catch (e1) {
          try {
            await getTvDetails(id);
            media_type = 'tv';
          } catch (e2) {
            media_type = 'movie';
          }
        }
      }
      
      return { movie_id: id, title: r.title, favourite_id: r.favourite_id, movielist: r.movielist || r.Movielist, media_type };
    }));
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function addFavorite(req, res, next) {
  try {
    const account_id = extractAccountId(req);
    if (!account_id) return res.status(401).json({ error: "Unauthorized" });

    const { id: movie_id, title, media_type: supplied_media_type } = req.body;
    if (!movie_id) return res.status(400).json({ error: "Missing movie id" });

    const list = await getOrCreateDefaultListForAccount(account_id);

    // Detect media_type if not supplied
    let media_type = supplied_media_type || 'movie';
    if (!supplied_media_type) {
      try {
        await getMovieDetails(movie_id);
        media_type = 'movie';
      } catch (e1) {
        try {
          await getTvDetails(movie_id);
          media_type = 'tv';
        } catch (e2) {
          media_type = 'movie';
        }
      }
    }

    // Encode media_type with the ID: "tv:123" or "movie:456"
    const encoded_id = `${media_type}:${movie_id}`;
    
    const existing = await findFavoriteByAccountAndMovie(account_id, encoded_id);
    if (existing) return res.status(409).json({ error: "Already favourited" });

    const added = await addFavoriteToList(list.favourite_id, encoded_id, title || null);
    console.log(`FAV ADD: account_id=${account_id} favourite_id=${list.favourite_id} movie_id=${movie_id} media_type=${media_type}`);
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
    // Try both formats: with and without media_type prefix
    let removed = await removeFavoriteFromList(list.favourite_id, String(movie_id));
    if (!removed) {
      // Try to find if it was stored with media_type prefix
      const parts = String(movie_id).split(':');
      if (parts.length === 2) {
        // Already has format, try as-is
        removed = await removeFavoriteFromList(list.favourite_id, String(movie_id));
      } else {
        // Try both tv: and movie: prefixed versions
        removed = await removeFavoriteFromList(list.favourite_id, `tv:${movie_id}`).catch(() => null);
        if (!removed) {
          removed = await removeFavoriteFromList(list.favourite_id, `movie:${movie_id}`);
        }
      }
    }
    console.log(`FAV DEL: account_id=${account_id} favourite_id=${list.favourite_id} movie_id=${movie_id} removed=${!!removed}`);
    if (!removed) return res.status(404).json({ error: "Favourite not found" });
    res.json({ message: "Removed from favourites" });
  } catch (err) {
    next(err);
  }
}
export async function debugAllFavorites(req, res, next) {
  try {
    const pool = (await import("../database.js")).default;
    const sql = `SELECT fi.id, fl.favourite_id, fl.account_id, fl.Movielist, fi.movie_id, fi.title FROM favourite_items fi JOIN favouritelist fl ON fi.favourite_id = fl.favourite_id ORDER BY fi.id DESC`;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
export async function getPublicList(req, res, next) {
  try {
    const favourite_id = req.params.id;
    if (!favourite_id) return res.status(400).json({ error: 'Missing list id' });

    const rows = await getFavoritesByListId(favourite_id);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'List not found or empty' });

    const listName = rows[0].movielist || rows[0].Movielist || 'Favorites';
    const items = await Promise.all(rows.map(async (r) => {
      let id = r.movie_id;
      let media_type = 'movie';
      
      // Decode media_type from stored movie_id (format: "tv:123" or "movie:456")
      const parts = String(id).split(':');
      if (parts.length === 2 && (parts[0] === 'tv' || parts[0] === 'movie')) {
        media_type = parts[0];
        id = parts[1];
      } else {
        // Fallback to detection for old stored data
        try {
          await getMovieDetails(id);
          media_type = 'movie';
        } catch (e1) {
          try {
            await getTvDetails(id);
            media_type = 'tv';
          } catch (e2) {
            media_type = 'movie';
          }
        }
      }
      
      return { movie_id: id, title: r.title, media_type };
    }));
    res.json({ favourite_id, listName, items });
  } catch (err) {
    next(err);
  }
}
