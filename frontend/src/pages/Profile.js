import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();
  const API = process.env.REACT_APP_API_URL || "";

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
          // map server { movie_id, title } -> { id, title }
          let mapped = (data || []).map(f => ({ id: String(f.movie_id), title: f.title }));
          // fetch thumbnails (TMDB proxy) in parallel
          try {
            const thumbs = await Promise.all(
              mapped.map(async (m) => {
                try {
                  const dres = await fetch(`${API}/tmdb/movie/${encodeURIComponent(m.id)}`);
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
        alert("Deletion failed on server. Trying locally.");
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

  async function deleteAccount() {
    const ok = window.confirm("Are you sure you want to delete your account? This action is irreversible.");
    if (!ok) return;

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
        alert("Account deleted.");
        navigate("/");
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
      alert("Local user data cleared (server did not respond).");
      navigate("/");
    }
  }

  return (
    <div>
      <Header />
      <div className="profile-container">
        <h2>Profile</h2>

        <div className="profile-grid">
          <div className="profile-sidebar">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar small">
                {account && account.username ? account.username.charAt(0).toUpperCase() : 'K'}
              </div>

              <div className="profile-userinfo">
                <div className="profile-username">{account?.username || 'Unknown user'}</div>
                <div className="profile-email">{account?.email || ''}</div>
              </div>
            </div>



            <Link to="/owngroups" style={{ textDecoration: "none" }}>
              <button className="btn profile-btn">My Groups</button>
            </Link>

            <Link to="/sharedfavorite" style={{ textDecoration: "none" }}>
              <button className="btn profile-btn">Share Your Favorites</button>
            </Link>
            <button onClick={deleteAccount} className="btn profile-btn danger">Delete Account</button>
          </div>

          <div style={{ flex: 1 }}>
            <h3>My Favorites List</h3>
            {loading ? (
              <p>Loading favorites…</p>
            ) : favorites.length === 0 ? (
              <p>You don't have any favorites yet.</p>
            ) : (
              <div className="favorites-list">
                  {favorites.map(fav => (
                    <div key={fav.id} className="favorite-item" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 92, height: 138, flex: '0 0 auto' }}>
                        {fav.image ? (
                          <img src={fav.image} alt={fav.title || 'Poster'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>No image</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Link to={`/movie/${fav.id}`} style={{ textDecoration: 'none', color: '#222', fontWeight: 600 }}>{fav.title || fav.name || 'Nimetön'}</Link>
                      </div>
                      <div>
                        <button onClick={() => removeFavorite(fav.id)} className="btn">Poista</button>
                      </div>
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
