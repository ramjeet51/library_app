"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "admin") router.push("/admin");
    else router.push("/student");
  }, []);

  return <p>Loading...</p>;
}
