"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    try {
      const res = await api("/login", "POST", { email, password });
      localStorage.setItem("token", res.token);
      localStorage.setItem("role", res.role);
      router.push("/dashboard");
    } catch {
      alert("Invalid credentials");
    }
  }

  return (
    <div className="card">
      <h2>Library Login</h2>

      <input
        className="input"
        type="email"
        placeholder="Email"
        value={email}
        autoComplete="off"
        onChange={e => setEmail(e.target.value)}
      />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        autoComplete="new-password"
        onChange={e => setPassword(e.target.value)}
      />

      <button className="btn" onClick={handleLogin}>
        Login
      </button>

      <div className="link">
        New here? <a href="/register">Create account</a>
      </div>
    </div>
  );
}
