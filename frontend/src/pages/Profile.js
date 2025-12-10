import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./styles/pagestyles.css";
import "./styles/Profile.css";

export default function Profile() {
  const AVATAR_CHOICES = [
    "avatars/avatar1.png",
    "avatars/avatar2.png",
    "avatars/avatar3.png",
    "avatars/avatar4.png",
    "avatars/avatar5.png",
  ];

  const resolveAvatarPath = (name) => {
    if (!name) return null;
    const clean = String(name).replace(/^\//, "");
    if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;
    return `${process.env.PUBLIC_URL || ""}/${clean}`;
  };

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || "";
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "" });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('account');
      if (raw) setAccount(JSON.parse(raw));
    } catch (e) {
      setAccount(null);
    }

    let cancelled = false;

    async function loadFavorites() {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const res = await fetch(`${API}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error("no api");
          const data = await res.json();
          // map server favorites robustly and detect media type (movie/tv)
          let mapped = (data || []).map(f => {
            // determine id and media type from common server fields
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
            return {
              id: String(mediaId),
              title: f.title,
              mediaType,
              listId: f.favourite_id ?? f.favouriteId,
              listName: f.movielist ?? f.Movielist,
            };
          });

          // fetch thumbnails (TMDB proxy) in parallel using the detected media type
          try {
            const thumbs = await Promise.all(
              mapped.map(async (m) => {
                try {
                  const dres = await fetch(`${API}/tmdb/${m.mediaType || 'movie'}/${encodeURIComponent(m.id)}`);
                  if (!dres.ok) return { ...m, image: null };
                  const j = await dres.json();
                  const image = j.poster_path ? `https://image.tmdb.org/t/p/w154${j.poster_path}` : null;
                  return { ...m, image };
                } catch (e) {
                  return { ...m, image: null };
                }
              })
            );
            mapped = thumbs;
          } catch (e) {
            // ignore thumbnail errors
          }

          if (!cancelled) setFavorites(mapped);
        } else {
          // anonymous fallback
          const local = JSON.parse(localStorage.getItem("favorites") || "[]");
          if (!cancelled) setFavorites(local);
        }
      } catch (e) {
        // fallback to localStorage
        if (!cancelled) {
          const local = JSON.parse(localStorage.getItem("favorites") || "[]");
          setFavorites(local);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFavorites();
    return () => {
      cancelled = true;
    };
  }, []);

  async function removeFavorite(id) {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const res = await fetch(`${API}/favorites/${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("delete failed");
        // update UI and localStorage
        setFavorites(prev => {
          const next = prev.filter(f => f.id !== id);
          localStorage.setItem("favorites", JSON.stringify(next));
          return next;
        });
        return;
      } catch (e) {
        setModalContent({ title: "Deletion Failed", message: "Deletion failed on server. Trying locally." });
        setShowModal(true);
        const local = JSON.parse(localStorage.getItem("favorites") || "[]").filter(f => f.id !== id);
        localStorage.setItem("favorites", JSON.stringify(local));
        setFavorites(local);
        return;
      }
    }

    // anonymous/local case — remove from localStorage and update UI
    const local = JSON.parse(localStorage.getItem("favorites") || "[]").filter(f => f.id !== id);
    localStorage.setItem("favorites", JSON.stringify(local));
    setFavorites(local);
  }

  function deleteAccount() {
    // show confirmation modal instead of native confirm()
    setShowConfirmDelete(true);
  }

  async function performDelete() {
    setShowConfirmDelete(false);
    try {
      const API = process.env.REACT_APP_API_URL || "";
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/auth`, { method: "DELETE", headers });
      if (res.ok) {
        // clear client data and navigate home
        localStorage.removeItem("favorites");
        localStorage.removeItem("localGroups");
        localStorage.removeItem("account");
        localStorage.removeItem("token");
        setModalContent({ title: "Account Deleted", message: "Account deleted." });
        setShowModal(true);
        setTimeout(() => navigate("/"), 1800);
        return;
      }
      // try to report server error details when possible
      let errMsg = "server error";
      try {
        const data = await res.json();
        if (data && data.error) errMsg = data.error;
      } catch (e) { }
      throw new Error(errMsg);
    } catch (e) {
      // fallback behaviour: clear local data
      localStorage.removeItem("favorites");
      localStorage.removeItem("localGroups");
      localStorage.removeItem("account");
      localStorage.removeItem("token");
      setModalContent({ title: "Local Data Cleared", message: "Local user data cleared (server did not respond)." });
      setShowModal(true);
      setTimeout(() => navigate("/"), 1200);
    }
  }

  async function handleAvatarSelect(avatar) {
    const token = localStorage.getItem("token");
    if (!token) {
      setModalContent({ title: "Login required", message: "Please log in to change your avatar." });
      setShowModal(true);
      setShowAvatarModal(false);
      return;
    }

    try {
      setSavingAvatar(true);
      const res = await fetch(`${API}/auth/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ avatar }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update avatar");

      const updatedAccount = data?.account || { ...(account || {}), avatar };
      setAccount(updatedAccount);
      localStorage.setItem("account", JSON.stringify(updatedAccount));
      window.dispatchEvent(new Event('account-updated'));

      setModalContent({ title: "Avatar Updated", message: "Your avatar has been changed." });
      setShowModal(true);
      setShowAvatarModal(false);
    } catch (err) {
      setModalContent({ title: "Avatar Update Failed", message: err.message });
      setShowModal(true);
    } finally {
      setSavingAvatar(false);
    }
  }

  const avatarUrl = resolveAvatarPath(account?.avatar);
  const avatarInitial = account && account.username ? account.username.charAt(0).toUpperCase() : "K";

  return (
    <div>
      <Header />
      <div className="profile-container">
        <h2>Profile</h2>

        <div className="profile-grid">
          <div className="profile-sidebar">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar small">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="profile-avatar-img" />
                ) : (
                  avatarInitial
                )}
              </div>

              <div className="profile-userinfo">
                <div className="profile-username">{account?.username || 'Unknown user'}</div>
                <div className="profile-email">{account?.email || ''}</div>
              </div>
            </div>

            <button className="btn profile-btn" onClick={() => setShowAvatarModal(true)}>Change Avatar</button>

            <Link to="/owngroups" className="link-unstyled">
              <button className="btn profile-btn">My Groups</button>
            </Link>

            <button
              className="btn profile-btn"
              onClick={() => {
                if (favorites && favorites.length > 0 && favorites[0].listId) {
                  const listId = favorites[0].listId;
                  const shareUrl = `${window.location.origin}/sharedfavorite?list=${encodeURIComponent(listId)}`;
                  navigator.clipboard.writeText(shareUrl).then(() => { setModalContent({ title: 'Copied', message: 'Shared link copied to clipboard: ' + shareUrl }); setShowModal(true); });
                } else {
                  setModalContent({ title: 'No Favorites', message: 'Add favorites to share a list.' });
                  setShowModal(true);
                }
              }}
            >
              Share your favorites
            </button>
            <button onClick={deleteAccount} className="btn profile-btn danger">Delete Account</button>
          </div>

            <div className="profile-main">
            <h3>My Favorites</h3>
            {/* Copy-link moved to sidebar; no inline copy button needed here */}
            {loading ? (
              <p>Loading favorites…</p>
            ) : favorites.length === 0 ? (
              <p>You don't have any favorites yet.</p>
            ) : (
              <div className="favorites-list">
                  {favorites.map(fav => (
                    <div key={fav.id} className="favorite-item">
                      <div className="favorite-image-wrapper">
                        {fav.image ? (
                          <img
                            src={fav.image}
                            alt={fav.title || 'Poster'}
                            className="favorite-image"
                          />
                        ) : (
                          <div className="favorite-placeholder">No image</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/${fav.mediaType || 'movie'}/${fav.id}`}
                          className="favorite-link"
                        >
                          {fav.title || fav.name || 'Unnamed'}
                        </Link>
                      </div>
                      <div>
                        <button onClick={() => removeFavorite(fav.id)} className="btn">Delete</button>
                      </div>
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
    {showAvatarModal && (
      <div className="modal-overlay" onClick={() => setShowAvatarModal(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="avatar-modal-title" onClick={(e) => e.stopPropagation()}>
          <h3 id="avatar-modal-title">Choose an avatar</h3>
          <div className="avatar-grid">
            {AVATAR_CHOICES.map((choice) => {
              const src = resolveAvatarPath(choice);
              const isSelected = account?.avatar === choice;
              return (
                <button
                  key={choice}
                  className={`avatar-choice${isSelected ? " selected" : ""}`}
                  onClick={() => handleAvatarSelect(choice)}
                  disabled={savingAvatar}
                >
                  {src ? (
                    <img src={src} alt={`Avatar ${choice}`} className="avatar-choice-img" />
                  ) : (
                    <span className="avatar-choice-fallback">{choice}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowAvatarModal(false)} disabled={savingAvatar}>Close</button>
          </div>
        </div>
      </div>
    )}
    {showConfirmDelete && (
      <div className="modal-overlay" onClick={() => setShowConfirmDelete(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(e) => e.stopPropagation()}>
          <h3 id="delete-account-title">Delete Account</h3>
          <p>Are you sure you want to delete your account? This action is irreversible.</p>
          <div className="modal-actions">
            <button className="btn" onClick={() => setShowConfirmDelete(false)}>Cancel</button>
            <button className="btn danger" onClick={performDelete}>Delete</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
