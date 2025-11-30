import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";

const API_BASE = process.env.REACT_APP_API_URL || "";

function Stars({ value }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span key={i} style={{ color: i <= value ? "#f5c518" : "#ccc", fontSize: 18 }}>
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
}

export default function SpecificMovie() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [localGroups, setLocalGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [joining, setJoining] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/tmdb/movie/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("tmdb fetch failed");
        const json = await res.json();
        // map TMDB response to our movie shape while keeping raw data
        const mapped = {
          id: json.id,
          title: json.title || json.name || `Movie ${id}`,
          description: json.overview || json.tagline || "",
          image: json.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : null,
          tmdb: json,
        };
        if (!cancelled) setMovie(mapped);
      } catch (e) {
        // fallback mock movie
        if (!cancelled)
          setMovie({
            id,
            title: "Batman Begins",
            description:
              "Batman Begins (2005) on Christopher Nolanin ohjaama supersankarielokuva. Placeholder-kuvaus.",
            image: null,
          });
      }

      // load reviews
      try {
        const r = await fetch(`/api/movies/${id}/reviews`);
        if (!r.ok) throw new Error("no reviews api");
        const rev = await r.json();
        if (!cancelled) setReviews(rev);
      } catch (e) {
        const local = JSON.parse(localStorage.getItem(`movieReviews:${id}`) || "[]");
        if (!cancelled) setReviews(local);
      }

      // load favorites: prefer server-side per-account favourites when logged in
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const rf = await fetch(`${API_BASE}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
          if (rf.ok) {
            const favJson = await rf.json();
            // map server shape { movie_id, title } -> { id, title }
            const fav = (favJson || []).map(f => ({ id: String(f.movie_id), title: f.title || null }));
            if (!cancelled) setFavorites(fav);
          } else {
            // fallback to localStorage
            const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
            if (!cancelled) setFavorites(fav);
          }
        } catch (e) {
          const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
          if (!cancelled) setFavorites(fav);
        }
      } else {
        const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
        if (!cancelled) setFavorites(fav);
      }

      // load local groups (created by user)
      const lg = JSON.parse(localStorage.getItem("localGroups") || "[]");
      if (!cancelled) setLocalGroups(lg);

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // keep loggedIn state in sync with localStorage (helps if user logs in/out in another tab)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setLoggedIn(!!e.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function isFavorite() {
    return favorites.some(f => String(f.id) === String(id));
  }

  async function toggleFavorite() {
    const already = isFavorite();
    if (already) {
      const next = favorites.filter(f => String(f.id) !== String(id));
      setFavorites(next);
      localStorage.setItem("favorites", JSON.stringify(next));
      // attempt server delete if logged in
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await fetch(`${API_BASE}/favorites/${encodeURIComponent(id)}`, { method: "DELETE", headers });
      } catch (e) {
        // ignore
      }
      return;
    }

    const newFav = { id, title: movie?.title || `Movie ${id}` };
    const next = [newFav, ...favorites];
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify(next));
    // attempt server add if logged in
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE}/favorites`, { method: "POST", headers, body: JSON.stringify({ id: String(newFav.id), title: newFav.title }) });
    } catch (e) {
      // ignore
    }
  }

  async function joinSelectedGroup() {
    if (!selectedGroup) return alert("Select a group first");
    setJoining(true);
    try {
      await fetch(`/api/groups/${selectedGroup}/join`, { method: "POST" });
      // store local membership
      const memberships = JSON.parse(localStorage.getItem("groupMemberships") || "{}");
      memberships[selectedGroup] = memberships[selectedGroup] || [];
      if (!memberships[selectedGroup].includes(id)) memberships[selectedGroup].push(id);
      localStorage.setItem("groupMemberships", JSON.stringify(memberships));
      alert("Added to group.");
    } catch (e) {
      // local fallback
      const memberships = JSON.parse(localStorage.getItem("groupMemberships") || "{}");
      memberships[selectedGroup] = memberships[selectedGroup] || [];
      if (!memberships[selectedGroup].includes(id)) memberships[selectedGroup].push(id);
      localStorage.setItem("groupMemberships", JSON.stringify(memberships));
      alert("Added locally to group (server did not respond).");
    } finally {
      setJoining(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) return alert("Provide a rating between 1 and 5");
    setSubmittingReview(true);
    const rev = { id: `local-${Date.now()}`, rating, comment: comment.trim(), user: "You", date: new Date().toISOString() };

    // optimistic UI
    const next = [rev, ...reviews];
    setReviews(next);
    try {
      const res = await fetch(`/api/movies/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: rev.rating, comment: rev.comment }),
      });
      if (!res.ok) throw new Error("post failed");
      // if server returns created review, replace local id (skip for simplicity)
    } catch (e) {
      // persist locally
      const existing = JSON.parse(localStorage.getItem(`movieReviews:${id}`) || "[]");
      localStorage.setItem(`movieReviews:${id}`, JSON.stringify([rev, ...existing]));
    } finally {
      setSubmittingReview(false);
      setComment("");
      setRating(5);
    }
  }

  function averageRating() {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }

  function formatRuntime(mins) {
    if (!mins && mins !== 0) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  if (loading || !movie) return (
    <div>
      <Header />
      <div className="page-container">
        <p>Loading movie…</p>
      </div>
    </div>
  );

  return (
    <div>
      <Header />
      <div className="movie-container">
        <div className="movie-grid">
          <div className="movie-sidebar">
            {movie.image ? (
              <img src={movie.image} alt={movie.title} className="specificmovie-poster" />
            ) : (
              <div className="movie-poster">
                <div className="movie-placeholder">No image</div>
              </div>
            )}

            <div className="movie-actions">
              <button
                onClick={toggleFavorite}
                className="btn"
                disabled={!loggedIn && !isFavorite()}
                title={!loggedIn && !isFavorite() ? 'Log in to add to favorites' : undefined}
              >
                {isFavorite() ? "Remove from favorites" : "Add to favorites"}
              </button>
              {!loggedIn && !isFavorite() && (
                <div style={{ marginTop: 6 }}>
                  <a href="/login">Log in to add to favorites</a>
                </div>
              )}
            </div>

            <div className="movie-actions">
              <div style={{ marginBottom: 6 }}>Add to group</div>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="group-select">
                <option value="">-- Select group --</option>
                {localGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button onClick={joinSelectedGroup} disabled={joining} className="btn" style={{ marginTop: 8 }}>
                Add to group
              </button>
            </div>
          </div>

          <div className="movie-main">
            <h2 className="movie-title">{movie.title}</h2>
            <div className="movie-meta" style={{ color: '#666', marginBottom: 8 }}>
              {movie.tmdb?.release_date && (
                <span>Release: {new Date(movie.tmdb.release_date).toLocaleDateString()}</span>
              )}
              {movie.tmdb?.runtime != null && (
                <span style={{ marginLeft: 12 }}>Duration: {formatRuntime(movie.tmdb.runtime)}</span>
              )}
            </div>
            <div className="avg-rating"><Stars value={Math.round(averageRating())} /> <span style={{ marginLeft: 8 }}>{averageRating()} / 5</span></div>
            {movie.tmdb?.genres && movie.tmdb.genres.length > 0 && (
              <div style={{ marginTop: 6 }}>Genres: {movie.tmdb.genres.map(g => g.name).join(', ')}</div>
            )}
            <p className="movie-description">{movie.description}</p>

            <hr />

            <h3>Write a review</h3>
            <form onSubmit={submitReview} className="review-form">
              <div>
                <label>Rating 1-5:</label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment (optional)" className="textarea-field" />

              <div>
                <button type="submit" disabled={submittingReview} className="btn primary">{submittingReview ? "Submitting…" : "Add review"}</button>
              </div>
            </form>

            <h3 className="" style={{ marginTop: 24 }}>Other users' reviews</h3>
            {reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(r => (
                  <div key={r.id} className="review-item">
                    <div className="review-header">
                      <div style={{ fontWeight: 600 }}>{r.user || "Anonymous"}</div>
                      <div><Stars value={Number(r.rating) || 0} /></div>
                    </div>
                    {r.comment && <div className="review-comment">{r.comment}</div>}
                    <div className="review-date">{new Date(r.date || Date.now()).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
