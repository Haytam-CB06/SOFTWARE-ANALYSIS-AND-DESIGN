
const redirectToBackend = async (path: string) => {
  // if backend not ready yet, try to wake it now
  if (!backendReady) {
    toast.message("Starting server…");
    const ok = await warmBackend();
    setBackendReady(ok);
    if (!ok) {
      toast.error("Server is waking up. Try again in a few seconds.");
      return;
    }
  }

  window.location.href = `${API_BASE_URL}${path}`;
};