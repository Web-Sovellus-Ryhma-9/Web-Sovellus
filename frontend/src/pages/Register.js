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
      alert("Passwords do not match.");
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
        alert("Registration successful. You can now log in.");
        window.location.href = "/login";
      })
      .catch((err) => {
        console.error(err);
        alert("Registration failed: " + err.message);
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
            placeholder="Username"  
            value={formData.username} onChange={handleChange} required/>
          </div>
          <div>
            <input type="email" id="email" name="email" 
            placeholder="Email"
            value={formData.email} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="password" name="password"
            placeholder="Password" 
            value={formData.password} onChange={handleChange} required/>
          </div>
          <div>
            <input type="password" id="confirmPassword" name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword} onChange={handleChange} required/>
          </div>
          <span className="nav-text-button" onClick={() => (window.location.href = "/login")}>Already registered? Log in!</span>
          <button type="Submit">Register</button>
        </form>
        </div>
    </div>
  );
}
