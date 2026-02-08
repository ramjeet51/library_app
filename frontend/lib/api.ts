export async function api(path: string, method = "GET", body?: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json();

  

  if (!res.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
}

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "/login";
};
