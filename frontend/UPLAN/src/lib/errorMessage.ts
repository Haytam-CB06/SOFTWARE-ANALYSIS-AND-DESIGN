export function errorMessage(e: any): string {
  if (!e) return "Unknown error";

  // If message is useful, use it (but NOT "[object Object]")
  const msg = e?.message;
  if (typeof msg === "string" && msg.trim() && msg.trim() !== "[object Object]") {
    return msg;
  }

  // FastAPI commonly returns: {"detail": "..."} OR {"detail": {...}} OR {"detail": [...]}
  const detail = e?.data?.detail ?? e?.detail ?? e?.response?.data?.detail;
  if (detail !== undefined && detail !== null) {
    if (typeof detail === "string") return detail;
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }

  // Other common fields
  const message = e?.data?.message ?? e?.message ?? e?.data?.error ?? e?.error;
  if (typeof message === "string" && message.trim() && message.trim() !== "[object Object]") return message;
  if (message) {
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  // last resort
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}
