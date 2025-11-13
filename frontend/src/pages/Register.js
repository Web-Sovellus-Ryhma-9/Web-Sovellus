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
    // Lähetä tiedot palvelimelle (esim. API-kutsu)
    console.log("Rekisteröitymistiedot:", formData);
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
            value={FormData.username} onChange={handleChange} required/>
          </div>
          <div>
            <input type="email" id="email" name="email" 
            placeholder="sähköposti"
            value={FormData.email} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="password" name="password"
            placeholder="Salasana" 
            value={FormData.password} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="confirmPassword" name="confirmPassword"
            placeholder="Vahvista salasana"
            value={FormData.confirmPassword} onChange={handleChange} required/>
          </div>
          <span className="nav-text-button" onClick={() => (window.location.href = "/login")}>Rekisteröitynyt jo? Kirjaudu sisään!</span>
          <button type="Submit">Rekisteröidy</button>
        </form>
        </div>
    </div>
  );
}
