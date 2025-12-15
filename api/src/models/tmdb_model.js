import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";

function ensureBearer() {
  if (!process.env.TMDB_BEARER) {
    throw new Error("TMDB_BEARER is not set in environment variables");
  }
}

export async function searchMovies(query, page = 1) {
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
  const with_genres = options.with_genres || options.genre || null;
  const with_cast = options.with_cast || null;

  if (options.query) {
    const url = `${TMDB_BASE}/search/movie`;
    const response = await axios.get(url, {
      params: { query: options.query, page, language: "en-US" },
      headers,
    });

    let results = response.data.results || [];
    results = results.map(r => ({ ...r, media_type: 'movie' }));

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

    return {
      page: response.data.page || page,
      results,
      total_results: results.length,
      total_pages: response.data.total_pages || 1,
    };
  }

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
  let data = response.data;
  if (data && Array.isArray(data.results)) {
    data.results = data.results.map(r => ({ ...r, media_type: 'movie' }));
  }
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
      total_results: results.length,
      total_pages: data.total_pages || null
    };
  }

  return data;
}

export async function findTv(options = {}) {
  ensureBearer();

  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const page = options.page || 1;
  const yearFrom = options.year_from ? parseInt(options.year_from, 10) : null;
  const yearTo = options.year_to ? parseInt(options.year_to, 10) : null;
  const with_genres = options.with_genres || options.genre || null;
  const with_cast = options.with_cast || null;

  if (options.query) {
    const url = `${TMDB_BASE}/search/tv`;
    const response = await axios.get(url, {
      params: { query: options.query, page, language: "en-US" },
      headers,
    });

    let results = response.data.results || [];
    results = results.map(r => ({ ...r, media_type: 'tv' }));

    if (yearFrom || yearTo) {
      results = results.filter((r) => {
        const y = r.first_air_date ? parseInt(r.first_air_date.slice(0, 4), 10) : null;
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

    return {
      page: response.data.page || page,
      results,
      total_results: results.length,
      total_pages: response.data.total_pages || 1,
    };
  }

  const url = `${TMDB_BASE}/discover/tv`;
  const params = {
    include_adult: false,
    language: "en-US",
    page,
    sort_by: options.sort_by || "popularity.desc",
  };

  if (with_genres) params.with_genres = with_genres;
  if (with_cast) params.with_cast = with_cast;
  if (yearFrom && yearTo) {
    params['first_air_date.gte'] = `${yearFrom}-01-01`;
    params['first_air_date.lte'] = `${yearTo}-12-31`;
  } else if (yearFrom) {
    params['first_air_date.gte'] = `${yearFrom}-01-01`;
  } else if (yearTo) {
    params['first_air_date.lte'] = `${yearTo}-12-31`;
  }

  const response = await axios.get(url, { params, headers });
  let data = response.data;
  if ((yearFrom || yearTo) || with_genres) {
    let results = data.results || [];

    if (yearFrom || yearTo) {
      results = results.filter((r) => {
        const y = r.first_air_date ? parseInt(r.first_air_date.slice(0, 4), 10) : null;
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
      results: results.map(r => ({ ...r, media_type: 'tv' })),
      total_results: results.length,
      total_pages: data.total_pages || null,
    };
  } else if (data && Array.isArray(data.results)) {
    data.results = data.results.map(r => ({ ...r, media_type: 'tv' }));
  }

  return data;
}

export async function getTvDetails(tvId) {
  ensureBearer();
  const url = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}

export async function getTvCredits(tvId) {
  ensureBearer();
  const url = `${TMDB_BASE}/tv/${encodeURIComponent(tvId)}/credits`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
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
  return response.data;
}

export async function getPersonTvCredits(personId) {
  ensureBearer();
  const url = `${TMDB_BASE}/person/${encodeURIComponent(personId)}/tv_credits`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}

export async function getMovieCredits(movieId) {
  ensureBearer();
  const url = `${TMDB_BASE}/movie/${encodeURIComponent(movieId)}/credits`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };
  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}
