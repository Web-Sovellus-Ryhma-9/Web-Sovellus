import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/Header";

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

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const API_BASE = process.env.REACT_APP_API_URL || "";
        const res = await fetch(`${API_BASE}/tmdb/movie/${id}`);
        if (!res.ok) throw new Error("tmdb fetch failed");
        const json = await res.json();
        // map TMDB response to our movie shape while keeping raw data
        const mapped = {
          id: json.id,
          title: json.title || json.name || `Movie ${id}`,
          description: json.overview || "",
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

      // load favorites
      const fav = JSON.parse(localStorage.getItem("favorites") || "[]");
      if (!cancelled) setFavorites(fav);

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

  function isFavorite() {
    return favorites.some(f => String(f.id) === String(id));
  }

  async function toggleFavorite() {
    const already = isFavorite();
    if (already) {
      const next = favorites.filter(f => String(f.id) !== String(id));
      setFavorites(next);
      localStorage.setItem("favorites", JSON.stringify(next));
      try {
        await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      } catch (e) {
        // ignore
      }
      return;
    }

    const newFav = { id, title: movie?.title || `Movie ${id}` };
    const next = [newFav, ...favorites];
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify(next));
    try {
      await fetch(`/api/favorites`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newFav) });
    } catch (e) {
      // ignore
    }
  }

  async function joinSelectedGroup() {
    if (!selectedGroup) return alert("Valitse ryhmä ensin");
    setJoining(true);
    try {
      await fetch(`/api/groups/${selectedGroup}/join`, { method: "POST" });
      // store local membership
      const memberships = JSON.parse(localStorage.getItem("groupMemberships") || "{}");
      memberships[selectedGroup] = memberships[selectedGroup] || [];
      if (!memberships[selectedGroup].includes(id)) memberships[selectedGroup].push(id);
      localStorage.setItem("groupMemberships", JSON.stringify(memberships));
      alert("Lisätty ryhmään.");
    } catch (e) {
      // local fallback
      const memberships = JSON.parse(localStorage.getItem("groupMemberships") || "{}");
      memberships[selectedGroup] = memberships[selectedGroup] || [];
      if (!memberships[selectedGroup].includes(id)) memberships[selectedGroup].push(id);
      localStorage.setItem("groupMemberships", JSON.stringify(memberships));
      alert("Lisätty paikallisesti ryhmään (palvelin ei vastannut).");
    } finally {
      setJoining(false);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) return alert("Anna arvostelu 1-5");
    setSubmittingReview(true);
    const rev = { id: `local-${Date.now()}`, rating, comment: comment.trim(), user: "Sinä", date: new Date().toISOString() };

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
        <p>Ladataan elokuvaa…</p>
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
              <button onClick={toggleFavorite} className="btn">
                {isFavorite() ? "Poista suosikeista" : "Lisää suosikkeihin"}
              </button>
            </div>

            <div className="movie-actions">
              <div style={{ marginBottom: 6 }}>Lisää ryhmään</div>
              <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="group-select">
                <option value="">-- Valitse ryhmä --</option>
                {localGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <button onClick={joinSelectedGroup} disabled={joining} className="btn" style={{ marginTop: 8 }}>
                Lisää ryhmään
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
              {movie.tmdb?.genres && movie.tmdb.genres.length > 0 && (
                <div style={{ marginTop: 6 }}>Genres: {movie.tmdb.genres.map(g => g.name).join(', ')}</div>
              )}
            </div>
            <div className="avg-rating"><Stars value={Math.round(averageRating())} /> <span style={{ marginLeft: 8 }}>{averageRating()} / 5</span></div>
            <p className="movie-description">{movie.description}</p>

            <hr />

            <h3>Kirjoita arvostelu</h3>
            <form onSubmit={submitReview} className="review-form">
              <div>
                <label>Asteikolla 1-5:</label>
                <select value={rating} onChange={e => setRating(Number(e.target.value))} style={{ marginLeft: 8 }}>
                  {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Kirjoita kommentti (valinnainen)" className="textarea-field" />

              <div>
                <button type="submit" disabled={submittingReview} className="btn primary">{submittingReview ? "Lähetetään…" : "Lisää arvostelu"}</button>
              </div>
            </form>

            <h3 className="" style={{ marginTop: 24 }}>Muiden käyttäjien arvostelut</h3>
            {reviews.length === 0 ? (
              <p>Ei arvosteluja vielä.</p>
            ) : (
              <div className="reviews-list">
                {reviews.map(r => (
                  <div key={r.id} className="review-item">
                    <div className="review-header">
                      <div style={{ fontWeight: 600 }}>{r.user || "Anonyymi"}</div>
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
