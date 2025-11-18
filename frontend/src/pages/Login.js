import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";


export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: formData.username, password: formData.password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || JSON.stringify(data));
        if (data.token) localStorage.setItem("token", data.token);
        if (data.account) localStorage.setItem("account", JSON.stringify(data.account));
        window.location.href = "/";
      })
      .catch((err) => {
        console.error(err);
        alert("Kirjautuminen epäonnistui: " + err.message);
      });
  };
  return (
    <div>
      <Header />
      <div className="auth-page-container">        
        <h2>Kirjaudu</h2>
        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Käyttäjätunnus"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Salasana"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <span className="nav-text-button" onClick={() => (window.location.href = "/Register")}>Etkö ole rekisteröitynyt? Paina tästä!</span>
          <button type="Submit">Kirjaudu</button>
        </form>
      </div>
    </div>
  );
}
