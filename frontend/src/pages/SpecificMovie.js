import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";

const API_BASE = process.env.REACT_APP_API_URL || "";

function Stars({ value, onChange, editable = false }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= value;
    const commonStyle = {
      color: filled ? "#f5c518" : "#ccc",
      fontSize: 22,
      cursor: editable ? "pointer" : "default",
      marginRight: 2,
    };
    stars.push(
      <span
        key={i}
        style={commonStyle}
        onClick={editable && onChange ? () => onChange(i) : undefined}
      >
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
}

export default function SpecificMovie() {
  const { id } = useParams();
  const location = useLocation();
  const mediaType = location.pathname && location.pathname.startsWith('/tv/') ? 'tv' : 'movie';
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [localGroups, setLocalGroups] = useState([]);
  const [serverGroups, setServerGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [joining, setJoining] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [account, setAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [credits, setCredits] = useState([]);
  const navigate = useNavigate();

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE}/tmdb/${mediaType}/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("tmdb fetch failed");
        const json = await res.json();
        // map TMDB response to a generic media shape while keeping raw data
        const mapped = {
          id: json.id,
          title: json.title || json.name || `Media ${id}`,
          description: json.overview || json.tagline || "",
          image: json.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : null,
          tmdb: json,
        };
        if (!cancelled) setMovie(mapped);
        // fetch credits for this media using TMDB id
        try {
          const mediaIdForCredits = json.id || id;
          const cRes = await fetch(`${API_BASE}/tmdb/${mediaType}/${encodeURIComponent(mediaIdForCredits)}/credits`);
          if (cRes.ok) {
            const cjson = await cRes.json();
            if (!cancelled) setCredits(cjson.cast || []);
          } else {
            if (!cancelled) setCredits([]);
          }
        } catch (err) {
          if (!cancelled) setCredits([]);
        }
      } catch (e) {
        // fallback mock
        if (!cancelled)
          setMovie({
            id,
            title: "Batman Begins",
            description:
              "Batman Begins (2005) on Christopher Nolanin ohjaama supersankarielokuva. Placeholder-kuvaus.",
            image: null,
          });
      }

      // load reviews (use API_BASE for consistency and map server fields)
      try {
        const r = await fetch(`${API_BASE}/movies/${id}/reviews`);
        if (!r.ok) throw new Error("no reviews api");
        const rev = await r.json();
        // map server shape { id/ review_id, username, created_at } -> { id, rating, comment, user, date, account_id }
        const mapped = (rev || []).map(item => ({
          id: item.id || item.review_id,
          rating: item.rating,
          comment: item.comment,
          user: item.username || item.user || 'Anonyymi',
          date: item.created_at || item.date || new Date().toISOString(),
          account_id: item.account_id || null,
        }));
        if (!cancelled) setReviews(mapped);
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
            // map server shape to include mediaType (movie/tv)
            const fav = (favJson || []).map(f => {
              let mediaType = 'movie';
              let mediaId = f.movie_id ?? f.movieId ?? f.id ?? null;
              if ((f.tv_id ?? f.tvId) != null) {
                mediaType = 'tv';
                mediaId = f.tv_id ?? f.tvId;
              } else if (f.media_type) {
                mediaType = String(f.media_type) === 'tv' ? 'tv' : 'movie';
                mediaId = f.media_id ?? mediaId ?? f.id;
              }
              mediaId = mediaId ?? f.movie_id ?? f.tv_id ?? f.id ?? '';
              return { id: String(mediaId), title: f.title || null, mediaType };
            });
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

  // load server groups for dropdown (so user can add movie to a real group)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/groups/getGroups`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setServerGroups(Array.isArray(j) ? j : []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // keep loggedIn state in sync with localStorage (helps if user logs in/out in another tab)
  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setLoggedIn(!!e.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // load account info from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('account');
      if (raw) setAccount(JSON.parse(raw));
    } catch (e) {
      setAccount(null);
    }
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

    const newFav = { id, title: movie?.title || `Movie ${id}`, mediaType };
    const next = [newFav, ...favorites];
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify(next));
    // attempt server add if logged in
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE}/favorites`, { method: "POST", headers, body: JSON.stringify({ id: String(newFav.id), title: newFav.title, media_type: mediaType }) });
    } catch (e) {
      // ignore
    }
  }

  async function joinSelectedGroup() {
    if (!selectedGroup) {
      setModalContent({ title: "Add to Group", message: "Select a group first" });
      setShowModal(true);
      return;
    }
    setJoining(true);
    try {
      // if selectedGroup corresponds to a server group id, verify membership
      const sg = serverGroups.find(g => String(g.group_id || g.id) === String(selectedGroup) || String(g.id) === String(selectedGroup));
      const token = localStorage.getItem('token');
      if (sg) {
        // for server group, post to backend API
        const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        const body = JSON.stringify({ group_id: selectedGroup, movie_id: String(id), title: movie?.title || `Movie ${id}`, image: movie?.image || null });
        try {
          const r = await fetch(`${API_BASE}/groups/movies/add`, { method: 'POST', headers, body });
          if (r.status === 201) {
            setModalContent({ title: 'Added', message: 'Movie added to group.' });
            setShowModal(true);
          } else if (r.status === 409) {
            setModalContent({ title: 'Already added', message: 'This movie is already in the selected group.' });
            setShowModal(true);
          } else if (r.status === 401 || r.status === 403) {
            setModalContent({ title: 'Not allowed', message: 'You are not allowed to add movies to this group.' });
            setShowModal(true);
          } else {
            setModalContent({ title: 'Failed', message: 'Could not add movie to group.' });
            setShowModal(true);
          }
        } catch (e) {
          setModalContent({ title: 'Failed', message: 'Network error while adding movie.' });
          setShowModal(true);
        }
        setJoining(false);
        return;
      }

      // Add movie to group movies in localStorage (local group)
      const key = `groupMovies:${selectedGroup}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const movieObj = { id: String(id), title: movie?.title || `Movie ${id}`, image: movie?.image || null, mediaType };
      if (!existing.some(m => String(m.id) === String(movieObj.id))) {
        existing.unshift(movieObj);
        localStorage.setItem(key, JSON.stringify(existing));
      }
      setModalContent({ title: "Added", message: "Movie added to group." });
      setShowModal(true);
    } catch (e) {
      setModalContent({ title: "Failed", message: "Could not add movie to group." });
      setShowModal(true);
    } finally {
      setJoining(false);
    }
  }

  const userReview = React.useMemo(() => {
    if (!account || !reviews || reviews.length === 0) return null;
    return reviews.find(r =>
      (r.account_id != null && account.account_id != null &&
       String(r.account_id) === String(account.account_id)
      ) || r.user === account.username
    ) || null;
  }, [reviews, account]);

  // when userReview changes, prefill form
  useEffect(() => {
    if (userReview) {
      setRating(Number(userReview.rating) || 5);
      setComment(userReview.comment || "");
    } else {
      setRating(5);
      setComment("");
    }
  }, [userReview]);

  async function submitReview(e) {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setModalContent({ title: "Invalid Rating", message: "Provide a rating between 1 and 5" });
      setShowModal(true);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setModalContent({ title: "Login Required", message: 'Log in to write a review.' });
      setShowModal(true);
      return;
    }
    setSubmittingReview(true);

    try {
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

      // if user already has a review, update it; otherwise create new
      const res = await fetch(`${API_BASE}/movies/${id}/reviews`, {
        method: "POST",
        headers,
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (res.status === 409 && !userReview) {
        setModalContent({ title: 'Already Reviewed', message: 'You have already reviewed this movie.' });
        setShowModal(true);
      } else if (!res.ok) {
        throw new Error("review save failed");
      }

      // re-fetch authoritative reviews so usernames/dates are correct
      try {
        const rr = await fetch(`${API_BASE}/movies/${id}/reviews`);
        if (rr.ok) {
          const j = await rr.json();
          const mapped = (j || []).map(item => ({
            id: item.id || item.review_id,
            rating: item.rating,
            comment: item.comment,
            user: item.username || item.user || 'Anonyymi',
            date: item.created_at || item.date || new Date().toISOString(),
            account_id: item.account_id || null,
          }));
          setReviews(mapped);
          localStorage.removeItem(`movieReviews:${id}`);
        }
      } catch (e) {
        // ignore
      }
    } catch (e) {
      alert('review save failed');
    } finally {
      setSubmittingReview(false);
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
                  <option key={`local-${g.id}`} value={g.id}>{g.name}</option>
                ))}
                {serverGroups && serverGroups.filter(g => Number(g.role_status) === 1 || Number(g.role_status) === 2).map(g => (
                  <option key={`srv-${g.group_id || g.id}`} value={g.group_id || g.id}>{g.name || g.group_name || g.groupName || `Group ${g.group_id || g.id}`}</option>
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
              {(movie.tmdb?.release_date || movie.tmdb?.first_air_date) && (
                <span>Release: {new Date(movie.tmdb.release_date || movie.tmdb.first_air_date).toLocaleDateString()}</span>
              )}
              {(movie.tmdb?.runtime != null || (movie.tmdb?.episode_run_time && movie.tmdb.episode_run_time.length > 0)) && (
                <span style={{ marginLeft: 12 }}>Duration: {formatRuntime(movie.tmdb.runtime || (movie.tmdb.episode_run_time && movie.tmdb.episode_run_time[0]) || 0)}</span>
              )}
            </div>
            <div className="avg-rating">
              <Stars value={Math.round(averageRating())} />
              <span style={{ marginLeft: 8 }}>
                {averageRating()} / 5
                <span style={{ marginLeft: 16 }}>
                  ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </span>
              </span>
            </div>
            {movie.tmdb?.genres && movie.tmdb.genres.length > 0 && (
              <div style={{ marginTop: 6 }}>Genres: {movie.tmdb.genres.map(g => g.name).join(', ')}</div>
            )}
            <p className="movie-description">{movie.description}</p>

            {credits && credits.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h3>Main cast</h3>
                <div className="cast-names" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {credits.slice(0, 6).map(actor => {
                    const key = actor.cast_id || actor.credit_id || actor.id;
                    const personId = actor.id;
                    const name = actor.name || '';
                    const go = () => {
                      // navigate to Search page performing a person search; include person_id for precision
                      const q = encodeURIComponent(name);
                      const path = `/search?search_by=person&person_id=${encodeURIComponent(personId)}&q=${q}&type=all`;
                      navigate(path);
                    };

                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={go}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go(); }}
                        title={`Find works by ${name}`}
                        style={{ padding: '6px 10px', background: '#f5f5f5', borderRadius: 6, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                      >
                        <div style={{ fontWeight: 600 }}>{name}</div>
                        {actor.character && <div style={{ fontSize: 12, color: '#666' }}>{actor.character}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <hr />

            <h3>{userReview ? "Edit your review" : "Write a review"}</h3>
            <form onSubmit={submitReview} className="review-form">
              <div>
                <label>{userReview ? "Edit rating:" : "Rating:"}</label>
                <div style={{ marginTop: 4 }}>
                  <Stars
                    value={rating}
                    editable={true}
                    onChange={(val) => setRating(val)}
                  />
                  <span style={{ marginLeft: 8 }}>{rating} / 5</span>
                </div>
              </div>

              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder={userReview ? "Edit your comment (optional)" : "Write a comment (optional)"}
                className="textarea-field"
              />

              <div>
                <button type="submit" disabled={submittingReview} className="btn primary">
                  {submittingReview
                    ? (userReview ? "Saving…" : "Submitting…")
                    : (userReview ? "Save changes" : "Add review")}
                </button>
              </div>
            </form>

            <h3 className="" style={{ marginTop: 24 }}>Other users' reviews</h3>
            {reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className="reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="review-item">
                        <div className="review-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600 }}>{r.user || "Anonyymi"}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Stars value={Number(r.rating) || 0} />
                            {loggedIn && account && r.account_id && Number(r.account_id) === Number(account.account_id) && (
                              <button className="btn" onClick={async () => {
                                if (!confirm('Poistetaanko arvostelusi?')) return;
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${API_BASE}/movies/${id}/reviews`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  if (!res.ok) throw new Error('delete failed');
                                  // re-fetch reviews
                                  const rr = await fetch(`${API_BASE}/movies/${id}/reviews`);
                                  if (rr.ok) {
                                    const j = await rr.json();
                                    const mapped = (j || []).map(item => ({
                                      id: item.id || item.review_id,
                                      rating: item.rating,
                                      comment: item.comment,
                                      user: item.username || item.user || 'Anonyymi',
                                      date: item.created_at || item.date || new Date().toISOString(),
                                      account_id: item.account_id || null,
                                    }));
                                    setReviews(mapped);
                                  }
                                } catch (e) {
                                  setModalContent({ title: 'Delete Failed', message: 'Delete failed' });
                                  setShowModal(true);
                                }
                              }}>Poista</button>
                            )}
                          </div>
                        </div>
                        {r.comment && <div className="review-comment">{r.comment}</div>}
                        <div className="review-date">{new Date(r.date || Date.now()).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>
    {showModal && (
      <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
          <h3 id="modal-title">{modalContent.title}</h3>
          <p>{modalContent.message}</p>
        </div>
      </div>
    )}
    </div>
  );
}
