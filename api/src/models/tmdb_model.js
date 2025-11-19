import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";

function ensureBearer() {
  if (!process.env.TMDB_BEARER) {
    throw new Error("TMDB_BEARER is not set in environment variables");
  }
}

export async function searchMovies(query, page = 1) {
  // backward-compatible wrapper
  return findMovies({ query, page });
}

export async function findMovies(options = {}) {
  ensureBearer();

  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const page = options.page || 1;
  const yearFrom = options.year_from ? parseInt(options.year_from, 10) : null;
  const yearTo = options.year_to ? parseInt(options.year_to, 10) : null;
  const with_genres = options.with_genres || options.genre || null; // comma separated ids
  const with_cast = options.with_cast || null; // person id(s), comma or pipe separated

  // If a textual query is provided, use the search endpoint and then apply simple filters server-side
  if (options.query) {
    const url = `${TMDB_BASE}/search/movie`;
    const response = await axios.get(url, {
      params: { query: options.query, page, language: "en-US" },
      headers,
    });

    let results = response.data.results || [];

    // filter by year range if provided
    if (yearFrom || yearTo) {
      results = results.filter((r) => {
        const y = r.release_date ? parseInt(r.release_date.slice(0, 4), 10) : null;
        if (!y) return false;
        if (yearFrom && y < yearFrom) return false;
        if (yearTo && y > yearTo) return false;
        return true;
      });
    }

    // filter by genre ids if provided
    if (with_genres) {
      const ids = ("" + with_genres).split(",").map((v) => parseInt(v, 10));
      results = results.filter((r) => Array.isArray(r.genre_ids) && ids.every((id) => r.genre_ids.includes(id)));
    }

    // Return a similar shape to TMDB search response
    return {
      page: response.data.page || page,
      results,
      total_results: results.length,
      total_pages: response.data.total_pages || 1,
    };
  }

  // No textual query: use discover endpoint with filters
  const url = `${TMDB_BASE}/discover/movie`;
  const params = {
    include_adult: false,
    include_video: false,
    language: "en-US",
    page,
    sort_by: options.sort_by || "popularity.desc",
  };

  if (with_genres) params.with_genres = with_genres;
  if (with_cast) params.with_cast = with_cast;
  if (yearFrom && yearTo) {
    params['primary_release_date.gte'] = `${yearFrom}-01-01`;
    params['primary_release_date.lte'] = `${yearTo}-12-31`;
  } else if (yearFrom) {
    params['primary_release_date.gte'] = `${yearFrom}-01-01`;
  } else if (yearTo) {
    params['primary_release_date.lte'] = `${yearTo}-12-31`;
  }

  const response = await axios.get(url, { params, headers });
  // If caller requested additional filtering (safety net), apply it server-side
  let data = response.data;
  if ((yearFrom || yearTo) || with_genres) {
    let results = data.results || [];

    if (yearFrom || yearTo) {
      results = results.filter((r) => {
        const y = r.release_date ? parseInt(r.release_date.slice(0, 4), 10) : null;
        if (!y) return false;
        if (yearFrom && y < yearFrom) return false;
        if (yearTo && y > yearTo) return false;
        return true;
      });
    }

    if (with_genres) {
      const ids = ("" + with_genres).split(",").map((v) => parseInt(v, 10));
      results = results.filter((r) => Array.isArray(r.genre_ids) && ids.every((id) => r.genre_ids.includes(id)));
    }

    data = {
      ...data,
      results,
      // Keep TMDB's total_pages (so frontend can request subsequent pages).
      // total_results becomes the filtered count for this page, but pagination
      // will still use TMDB's total_pages value.
      total_results: results.length,
      total_pages: data.total_pages || null
    };
  }

  return data;
}

export async function getMovieDetails(movieId) {
  ensureBearer();

  const url = `${TMDB_BASE}/movie/${encodeURIComponent(movieId)}`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}

export async function nowPlaying(page = 1, region = "FI") {
  ensureBearer();

  const url = `${TMDB_BASE}/movie/now_playing`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const params = { language: "en-US", page };
  if (region) params.region = region;

  const response = await axios.get(url, { params, headers });
  return response.data;
}

export async function getGenres() {
  ensureBearer();
  const url = `${TMDB_BASE}/genre/movie/list`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}

export async function searchPersonByName(name, page = 1) {
  ensureBearer();
  const url = `${TMDB_BASE}/search/person`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { query: name, page, language: "en-US" }, headers });
  return response.data;
}

export async function getPersonMovieCredits(personId) {
  ensureBearer();
  const url = `${TMDB_BASE}/person/${encodeURIComponent(personId)}/movie_credits`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data; // contains `cast` and `crew`
}
