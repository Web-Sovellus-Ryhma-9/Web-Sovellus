import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/SpecificMovie.css";

const API_BASE = process.env.REACT_APP_API_URL || "";

function Stars({ value, onChange, editable = false }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = i <= value;
    const className = [
      "star",
      filled ? "star-filled" : "",
      editable ? "star-editable" : "",
    ]
      .filter(Boolean)
      .join(" ");
    stars.push(
      <span
        key={i}
        className={className}
        onClick={editable && onChange ? () => onChange(i) : undefined}
      >
        ★
      </span>
    );
  }
  return <span>{stars}</span>;
}

function resolveAvatarPath(name) {
  if (!name) return null;
  const clean = String(name).replace(/^\//, "");
  if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;
  return `${process.env.PUBLIC_URL || ""}/${clean}`;
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
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = React.useRef(null);
  const [joining, setJoining] = useState(false);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [account, setAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [credits, setCredits] = useState([]);
  const navigate = useNavigate();

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
        const mapped = {
          id: json.id,
          title: json.title || json.name || `Media ${id}`,
          description: json.overview || json.tagline || "",
          image: json.poster_path ? `https://image.tmdb.org/t/p/w500${json.poster_path}` : null,
          tmdb: json,
        };
        if (!cancelled) setMovie(mapped);
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
        if (!cancelled)
          setMovie({
            id,
            title: "Batman Begins",
            description:
              "Batman Begins (2005) on Christopher Nolanin ohjaama supersankarielokuva. Placeholder-kuvaus.",
            image: null,
          });
      }

      try {
        const r = await fetch(`${API_BASE}/movies/${id}/reviews`);
        if (!r.ok) throw new Error("no reviews api");
        const rev = await r.json();
        const mapped = (rev || []).map(item => ({
          id: item.id || item.review_id,
          rating: item.rating,
          comment: item.comment,
          user: item.username || item.user || 'Anonyymi',
          date: item.created_at || item.date || new Date().toISOString(),
          account_id: item.account_id || null,
          avatar: item.avatar || null,
        }));
        if (!cancelled) setReviews(mapped);
      } catch (e) {
        const local = JSON.parse(localStorage.getItem(`movieReviews:${id}`) || "[]");
        if (!cancelled) setReviews(local);
      }

      const token = localStorage.getItem("token");
      if (token) {
        try {
          const rf = await fetch(`${API_BASE}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
          if (rf.ok) {
            const favJson = await rf.json();
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

      const lg = JSON.parse(localStorage.getItem("localGroups") || "[]");
      if (!cancelled) setLocalGroups(lg);

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'token') setLoggedIn(!!e.newValue);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('account');
      if (raw) setAccount(JSON.parse(raw));
    } catch (e) {
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target)) {
        setGroupDropdownOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setGroupDropdownOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
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
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await fetch(`${API_BASE}/favorites/${encodeURIComponent(id)}`, { method: "DELETE", headers });
      } catch (e) {
      }
      return;
    }

    const newFav = { id, title: movie?.title || `Movie ${id}`, mediaType };
    const next = [newFav, ...favorites];
    setFavorites(next);
    localStorage.setItem("favorites", JSON.stringify(next));
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${API_BASE}/favorites`, { method: "POST", headers, body: JSON.stringify({ id: String(newFav.id), title: newFav.title, media_type: mediaType }) });
    } catch (e) {
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
      const sg = serverGroups.find(g => String(g.group_id || g.id) === String(selectedGroup) || String(g.id) === String(selectedGroup));
      const token = localStorage.getItem('token');
      if (sg) {
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
            avatar: item.avatar || null,
          }));
          setReviews(mapped);
          localStorage.removeItem(`movieReviews:${id}`);
        }
      } catch (e) {
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

  function scrollToReviews() {
    const el = document.getElementById('reviews-section');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
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
                <div className="login-hint">
                  <a href="/login">Log in to add to favorites</a>
                </div>
              )}
            </div>

            <div className="movie-actions">
              <div className="movie-add-to-group-label">Add to group</div>
              <div className="group-select-wrapper" ref={groupDropdownRef}>
                <button
                  type="button"
                  className="group-select"
                  onClick={() => setGroupDropdownOpen(open => !open)}
                  aria-haspopup="listbox"
                  aria-expanded={groupDropdownOpen}
                >
                  {(() => {
                    if (!selectedGroup) return "-- Select group --";
                    const lg = localGroups.find(g => String(g.id) === String(selectedGroup));
                    if (lg) return lg.name;
                    const sg = serverGroups.find(g => String(g.group_id || g.id) === String(selectedGroup) || String(g.id) === String(selectedGroup));
                    if (sg) return sg.name || sg.group_name || sg.groupName || `Group ${sg.group_id || sg.id}`;
                    return "-- Select group --";
                  })()}
                </button>

                {groupDropdownOpen && (
                  <ul className="group-dropdown" role="listbox">
                    <li key="opt-empty" role="option" tabIndex={0} className={`group-dropdown-item ${selectedGroup === '' ? 'selected' : ''}`} onClick={() => { setSelectedGroup(''); setGroupDropdownOpen(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedGroup(''); setGroupDropdownOpen(false); } }}>-- Select group --</li>
                    {localGroups.map(g => (
                      <li key={`local-${g.id}`} role="option" tabIndex={0} className={`group-dropdown-item ${String(selectedGroup) === String(g.id) ? 'selected' : ''}`} onClick={() => { setSelectedGroup(g.id); setGroupDropdownOpen(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedGroup(g.id); setGroupDropdownOpen(false); } }}>{g.name}</li>
                    ))}
                    {serverGroups && serverGroups.filter(g => Number(g.role_status) === 1 || Number(g.role_status) === 2).map(g => (
                      <li key={`srv-${g.group_id || g.id}`} role="option" tabIndex={0} className={`group-dropdown-item ${String(selectedGroup) === String(g.group_id || g.id) ? 'selected' : ''}`} onClick={() => { setSelectedGroup(g.group_id || g.id); setGroupDropdownOpen(false); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedGroup(g.group_id || g.id); setGroupDropdownOpen(false); } }}>{g.name || g.group_name || g.groupName || `Group ${g.group_id || g.id}`}</li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={joinSelectedGroup}
                disabled={joining}
                className="btn movie-add-to-group-button"
              >
                Add to group
              </button>
            </div>
          </div>

          <div className="movie-main">
            <h2 className="movie-title">{movie.title}</h2>
            <div className="movie-meta">
              {(movie.tmdb?.release_date || movie.tmdb?.first_air_date) && (
                <span>Release: {new Date(movie.tmdb.release_date || movie.tmdb.first_air_date).toLocaleDateString()}</span>
              )}
              {(movie.tmdb?.runtime != null || (movie.tmdb?.episode_run_time && movie.tmdb.episode_run_time.length > 0)) && (
                <span className="rating-count-inline">
                  Duration: {formatRuntime(movie.tmdb.runtime || (movie.tmdb.episode_run_time && movie.tmdb.episode_run_time[0]) || 0)}
                </span>
              )}
            </div>
            <div className="avg-rating">
              <Stars value={Math.round(averageRating())} />
              <span className="rating-value-inline">
                {averageRating()} / 5
                <span
                  className="rating-count-inline"
                  role="button"
                  tabIndex={0}
                  title="Jump to reviews"
                  onClick={scrollToReviews}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scrollToReviews(); } }}
                  style={{ cursor: 'pointer' }}
                >
                  ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </span>
              </span>
            </div>
            {movie.tmdb?.genres && movie.tmdb.genres.length > 0 && (
              <div className="movie-genres">Genres: {movie.tmdb.genres.map(g => g.name).join(', ')}</div>
            )}
            <p className="movie-description">{movie.description}</p>

            {credits && credits.length > 0 && (
              <div className="movie-cast-section">
                <h3>Main cast</h3>
                <div className="cast-names">
                  {credits.slice(0, 6).map(actor => {
                    const key = actor.cast_id || actor.credit_id || actor.id;
                    const personId = actor.id;
                    const name = actor.name || '';
                    const go = () => {
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
                        className="cast-pill"
                      >
                        <div className="cast-pill-name">{name}</div>
                        {actor.character && (
                          <div className="cast-pill-character">{actor.character}</div>
                        )}
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
                <div className="rating-row">
                  <Stars
                    value={rating}
                    editable={true}
                    onChange={(val) => setRating(val)}
                  />
                  <span className="rating-value-inline">{rating} / 5</span>
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

            <h3 id="reviews-section" className="reviews-title">Other users' reviews</h3>
            {reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className="reviews-list">
                    {reviews.map(r => {
                      const avatarSrc = resolveAvatarPath(r.avatar);
                      const initial = (r.user || 'A').charAt(0).toUpperCase();
                      return (
                      <div key={r.id} className="review-item">
                        <div className="review-header">
                          <div className="review-user-section">
                            <div className="review-avatar">
                              {avatarSrc ? (
                                <img src={avatarSrc} alt={`${r.user || 'User'} avatar`} className="review-avatar-img" />
                              ) : (
                                <span className="review-avatar-fallback">{initial}</span>
                              )}
                            </div>
                            <div className="review-user">{r.user || "Anonyymi"}</div>
                          </div>
                          <div className="review-meta">
                            <Stars value={Number(r.rating) || 0} />
                            {loggedIn && account && r.account_id && Number(r.account_id) === Number(account.account_id) && (
                              <button className="btn" onClick={async () => {
                                if (!confirm('Poistetaanko arvostelusi?')) return;
                                try {
                                  const token = localStorage.getItem('token');
                                  const res = await fetch(`${API_BASE}/movies/${id}/reviews`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                  if (!res.ok) throw new Error('delete failed');
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
                                      avatar: item.avatar || null,
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
                    );
                    })}
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
