import { searchMovies, getMovieDetails } from "../models/tmdb_model.js";

export async function search(req, res, next) {
  try {
    const q = req.query.q || req.query.query;
    if (!q) return res.status(400).json({ error: "Missing query parameter 'q'" });
    const page = req.query.page || 1;
    const data = await searchMovies(q, page);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function details(req, res, next) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing movie id" });
    const data = await getMovieDetails(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
