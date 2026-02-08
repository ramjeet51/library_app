"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const register = async () => {
    try {
      setError("");
      setMsg("");

      await api("/register", "POST", {
        name,
        email,
        password,
        role,
      });

      setMsg("Registration successful. Please login.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (err: any) {
      setError(err?.detail || "Registration failed");
    }
  };

  return (
    <div className="card">
      <h2>Register</h2>

      <input
        className="input"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

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

      <select
        className="select"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="student">Student</option>
        <option value="admin">Admin</option>
      </select>

      {error && <p style={{ color: "#f87171" }}>{error}</p>}
      {msg && <p style={{ color: "#34d399" }}>{msg}</p>}

      <button className="btn" onClick={register}>
        Register
      </button>

      <div className="link">
        Already have an account?{" "}
        <a href="/login">Login</a>
      </div>
    </div>
  );
}
