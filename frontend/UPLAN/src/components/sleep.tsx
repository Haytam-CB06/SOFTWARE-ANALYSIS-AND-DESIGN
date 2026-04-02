import { useState} from "react";
import { getHealth } from "../src/services/api"; 

export default function App() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function handleClick() {
    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const data = await getHealth();
      setMsg(`Backend OK: ${JSON.stringify(data)}`);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Waking server..." : "Call backend"}
      </button>

      {msg && <p>{msg}</p>}
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
}