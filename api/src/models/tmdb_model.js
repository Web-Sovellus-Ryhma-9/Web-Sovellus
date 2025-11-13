import axios from "axios";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function searchMovies(query, page = 1) {
  if (!process.env.TMDB_BEARER) {
    throw new Error("TMDB_BEARER is not set in environment variables");
  }

  const url = `${TMDB_BASE}/search/movie`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const response = await axios.get(url, {
    params: { query, page, language: "en-US" },
    headers,
  });

  return response.data;
}

export async function getMovieDetails(movieId) {
  if (!process.env.TMDB_BEARER) {
    throw new Error("TMDB_BEARER is not set in environment variables");
  }

  const url = `${TMDB_BASE}/movie/${encodeURIComponent(movieId)}`;
  const headers = {
    accept: "application/json",
    Authorization: `Bearer ${process.env.TMDB_BEARER}`,
  };

  const response = await axios.get(url, { params: { language: "en-US" }, headers });
  return response.data;
}

export async function nowPlaying(page = 1, region = "FI") {
  if (!process.env.TMDB_BEARER) {
    throw new Error("TMDB_BEARER is not set in environment variables");
  }

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
