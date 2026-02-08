"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ if already logged in → redirect
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/student";
      }
    }
  }, []);

  const login = async () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setError("");

      const res = await api("/login", "POST", {
        email,
        password,
      });

      // ✅ SAVE ALL REQUIRED DATA
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      localStorage.setItem("user_id", String(res.user_id));

      // ✅ REDIRECT BASED ON ROLE
      if (res.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/student";
      }
    } catch (err: any) {
      setError(err?.detail || "Invalid email or password");
    }
  };

  return (
    <div className="card page-animate">
      <h2>Login</h2>

      <input
        className="input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error && <p style={{ color: "#f87171" }}>{error}</p>}

      <button className="btn" onClick={login}>
        Login
      </button>

      {/* REGISTER LINK */}
      <div className="link">
        Don’t have an account?{" "}
        <a href="/register">Register</a>
      </div>
    </div>
  );
}
