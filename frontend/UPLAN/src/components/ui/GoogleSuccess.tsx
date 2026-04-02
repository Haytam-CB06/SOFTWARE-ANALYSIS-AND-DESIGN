import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (email) {
      localStorage.setItem("currentUserEmail", email);
      navigate("/");
    }
  }, [navigate]);

  return null;
}
