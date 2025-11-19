import { findMovies, getMovieDetails, nowPlaying, getGenres, searchPersonByName, getPersonMovieCredits } from "../models/tmdb_model.js";

export async function search(req, res, next) {
  try {
    // debug: log incoming query params to help diagnose filter issues
    console.log('TMDB /search called with query:', req.query);
    const q = req.query.q || req.query.query || null;
    const page = req.query.page || 1;
    const opts = {
      query: q,
      page,
      year_from: req.query.year_from || req.query.yearFrom || null,
      year_to: req.query.year_to || req.query.yearTo || null,
      with_genres: req.query.with_genres || req.query.genre || req.query.genres || null,
    };

    // allow calling without query to discover by filters
    const data = await findMovies(opts);
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

export async function now_playing(req, res, next) {
  try {
    const page = req.query.page || 1;
    const region = req.query.region || "FI";
    const data = await nowPlaying(page, region);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function genres(req, res, next) {
  try {
    const data = await getGenres();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function search_person(req, res, next) {
  try {
    const q = req.query.q || req.query.query || null;
    const page = req.query.page || 1;
    if (!q) return res.status(400).json({ error: 'Missing query' });
    const data = await searchPersonByName(q, page);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function person_movies(req, res, next) {
  try {
    const q = req.query.q || null;
    const personId = req.query.person_id || null;
    if (!q && !personId) return res.status(400).json({ error: 'Missing person name or id' });

    let id = personId;
    if (!id) {
      const people = await searchPersonByName(q, 1);
      const person = people && people.results && people.results[0];
      if (!person) return res.json({ page: 1, results: [], total_results: 0, total_pages: 1 });
      id = person.id;
    }

    const page = req.query.page || 1;
    const opts = {
      with_cast: String(id),
      page,
      year_from: req.query.year_from || req.query.yearFrom || null,
      year_to: req.query.year_to || req.query.yearTo || null,
      with_genres: req.query.with_genres || req.query.genre || req.query.genres || null,
    };

    // use discover via findMovies so filters (years, genres) work correctly
    const data = await findMovies(opts);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
