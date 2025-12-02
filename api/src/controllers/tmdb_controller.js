import { findMovies, findTv, getMovieDetails, getTvDetails, nowPlaying, getGenres, searchPersonByName, getPersonMovieCredits, getPersonTvCredits, getMovieCredits, getTvCredits } from "../models/tmdb_model.js";

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
      const type = (req.query.type || req.query.search_type || 'movie');
      if (type === 'tv') {
        const data = await findTv(opts);
        res.json(data);
        return;
      }

      if (type === 'all') {
        // run both movie and tv searches and merge results (simple merge, page 1)
        const [movies, tvs] = await Promise.all([findMovies(opts), findTv(opts)]);
        const results = [];
        const seen = new Set();
        for (const r of (movies.results || [])) {
          const key = `movie:${r.id}`;
          if (!seen.has(key)) { seen.add(key); results.push(r); }
        }
        for (const r of (tvs.results || [])) {
          const key = `tv:${r.id}`;
          if (!seen.has(key)) { seen.add(key); results.push(r); }
        }
        res.json({ page: 1, results, total_results: results.length, total_pages: Math.max(movies.total_pages || 1, tvs.total_pages || 1) });
        return;
      }

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

    // Get person's acting credits (cast only) for movies and TV
    const movieCredits = await getPersonMovieCredits(id);
    const tvCredits = await getPersonTvCredits(id);

    const yearFrom = req.query.year_from ? parseInt(req.query.year_from, 10) : (req.query.yearFrom ? parseInt(req.query.yearFrom, 10) : null);
    const yearTo = req.query.year_to ? parseInt(req.query.year_to, 10) : (req.query.yearTo ? parseInt(req.query.yearTo, 10) : null);
    const with_genres = req.query.with_genres || req.query.genre || req.query.genres || null;

    let results = [];
    if (movieCredits && Array.isArray(movieCredits.cast)) {
      results = results.concat(movieCredits.cast.map((m) => ({ ...m, media_type: 'movie' })));
    }
    if (tvCredits && Array.isArray(tvCredits.cast)) {
      results = results.concat(tvCredits.cast.map((t) => ({ ...t, media_type: 'tv' })));
    }

    // filter by year (use release_date for movies, first_air_date for tv)
    if (yearFrom || yearTo) {
      results = results.filter((r) => {
        const yStr = r.media_type === 'tv' ? r.first_air_date : r.release_date;
        const y = yStr ? parseInt((yStr || '').slice(0, 4), 10) : null;
        if (!y) return false;
        if (yearFrom && y < yearFrom) return false;
        if (yearTo && y > yearTo) return false;
        return true;
      });
    }

    // filter by genre ids if available on credit items
    if (with_genres) {
      const ids = ("" + with_genres).split(",").map((v) => parseInt(v, 10));
      results = results.filter((r) => Array.isArray(r.genre_ids) && ids.every((id) => r.genre_ids.includes(id)));
    }

    // Deduplicate (same id may appear in both movie and tv arrays unlikely but safe)
    const seen = new Set();
    results = results.filter((r) => {
      const key = `${r.media_type}:${r.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // sort by popularity/date where available (most recent/popular first)
    results.sort((a, b) => {
      const popA = a.popularity || 0; const popB = b.popularity || 0;
      if (popA !== popB) return popB - popA;
      const dateA = (a.media_type === 'tv' ? a.first_air_date : a.release_date) || '';
      const dateB = (b.media_type === 'tv' ? b.first_air_date : b.release_date) || '';
      return dateB.localeCompare(dateA);
    });

    res.json({ page: 1, results, total_results: results.length, total_pages: 1 });
  } catch (err) {
    next(err);
  }
}

export async function credits(req, res, next) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing movie id" });
    const data = await getMovieCredits(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function tv_details(req, res, next) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing tv id" });
    const data = await getTvDetails(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function tv_credits(req, res, next) {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing tv id" });
    const data = await getTvCredits(id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
