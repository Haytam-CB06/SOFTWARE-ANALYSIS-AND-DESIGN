const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function HgetHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error("Backend unreachable");
  }
  return response.json();
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchWithWarmup(path, options = {}, retries = 6) {
  const url = `${API_BASE_URL}${path}`;
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);

    const ct = res.headers.get("content-type") || "";

    // Render cold-start can return an HTML "waking up" page, not JSON
    if (ct.includes("application/json")) return res;

    await sleep(1500);
  }

  throw new Error("Server is waking up… please try again in a moment.");
}

export async function getHealth() {
  const res = await fetchWithWarmup("/health");
  return res.json();
}