import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function Profile() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();

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
        const res = await fetch("/api/favorites");
        if (!res.ok) throw new Error("no api");
        const data = await res.json();
        if (!cancelled) setFavorites(data);
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
    // optimistic update
    setFavorites(prev => prev.filter(f => f.id !== id));

    try {
      const res = await fetch(`/api/favorites/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
    } catch (e) {
      // fallback: remove from localStorage
      const local = JSON.parse(localStorage.getItem("favorites") || "[]").filter(f => f.id !== id);
      localStorage.setItem("favorites", JSON.stringify(local));
    }
  }

  async function deleteAccount() {
    const ok = window.confirm("Haluatko varmasti poistaa tilisi? Tämä toiminto on peruuttamaton.");
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
        alert("Tili poistettu.");
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
      alert("Paikalliset käyttäjätiedot poistettu (palvelin ei vastannut).");
      navigate("/");
    }
  }

  return (
    <div>
      <Header />
      <div className="profile-container">
        <h2>Profiili</h2>

        <div className="profile-grid">
          <div className="profile-sidebar">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar small">
                {account && account.username ? account.username.charAt(0).toUpperCase() : 'K'}
              </div>

              <div className="profile-userinfo">
                <div className="profile-username">{account?.username || 'Tuntematon käyttäjä'}</div>
                <div className="profile-email">{account?.email || ''}</div>
              </div>
            </div>



            <Link to="/owngroups" style={{ textDecoration: "none" }}>
              <button className="btn profile-btn">Omat ryhmät</button>
            </Link>

            <Link to="/sharedfavorite" style={{ textDecoration: "none" }}>
              <button className="btn profile-btn">Jaa suosikkisi</button>
            </Link>
            <button onClick={deleteAccount} className="btn profile-btn danger">Poista tili</button>
          </div>

          <div style={{ flex: 1 }}>
            <h3>Oma suosikkilista</h3>
            {loading ? (
              <p>Ladataan suosikkeja…</p>
            ) : favorites.length === 0 ? (
              <p>Sinulla ei ole suosikkeja vielä.</p>
            ) : (
              <div className="favorites-list">
                {favorites.map(fav => (
                  <div key={fav.id} className="favorite-item">
                    <div>{fav.title || fav.name || "Nimetön"}</div>
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
