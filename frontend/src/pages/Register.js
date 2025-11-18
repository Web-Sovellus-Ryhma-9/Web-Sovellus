import React, { useState } from "react";
import Header from "../components/Header";
import "./styles/pagestyles.css";


export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Salasanat eivät täsmää!");
      return;
    }
    const API = process.env.REACT_APP_API_URL || "";
    fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: formData.username, email: formData.email, password: formData.password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || JSON.stringify(data));
        alert("Rekisteröinti onnistui. Voit nyt kirjautua sisään.");
        window.location.href = "/login";
      })
      .catch((err) => {
        console.error(err);
        alert("Rekisteröinti epäonnistui: " + err.message);
      });
  };
  return (
    <div>
      <Header />
      <div className="auth-page-container">

        <h2>Rekisteröidy</h2>
        <form className="register-form" onSubmit={handleSubmit}>
          <div>
            <input type="text" id="username" name="username"
            placeholder="Käyttäjätunnus"  
            value={formData.username} onChange={handleChange} required/>
          </div>
          <div>
            <input type="email" id="email" name="email" 
            placeholder="sähköposti"
            value={formData.email} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="password" name="password"
            placeholder="Salasana" 
            value={formData.password} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="confirmPassword" name="confirmPassword"
            placeholder="Vahvista salasana"
            value={formData.confirmPassword} onChange={handleChange} required/>
          </div>
          <span className="nav-text-button" onClick={() => (window.location.href = "/login")}>Rekisteröitynyt jo? Kirjaudu sisään!</span>
          <button type="Submit">Rekisteröidy</button>
        </form>
        </div>
    </div>
  );
}
