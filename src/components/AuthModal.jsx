import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function EyeIcon({ open }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export default function AuthModal() {
  const { authModal, setAuthModal, signin, signup, user } = useAuth();
  const [mode, setMode] = useState(authModal.mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!authModal.open || user) return null;

  const close = () => {
    setAuthModal({ open: false, mode: "signin" });
    setError("");
    setSuccess("");
  };

  const toggle = () => {
    setMode((m) => (m === "signin" ? "signup" : "signin"));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || !password.trim())
      return setError("Please fill in all fields");
    if (mode === "signup") {
      if (password !== confirmPassword)
        return setError("Passwords do not match");
    }

    const result =
      mode === "signin"
        ? await signin(email.trim(), password)
        : await signup(email.trim(), password);
    if (!result.ok) return setError(result.error);

    if (mode === "signup") {
      setSuccess(
        "Registration successful! Please check your email to verify your account."
      );
      return;
    }

    const sess = localStorage.getItem("kalleenepal_session");
    let u = null;
    try {
      u = JSON.parse(sess);
    } catch {}
    if (u?.role === "admin") window.location.href = "/admin/dashboard";
    else if (u?.id) window.location.href = `/${u.id}/dashboard`;
    else window.location.href = "/";
    close();
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-cream text-dark placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/30 pr-10";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md mx-4 p-8 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-2xl leading-none text-muted hover:text-dark"
          onClick={close}
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-dark mb-1">
          {mode === "signin" ? "Welcome back" : "Join Kallee Nepal"}
        </h2>
        <p className="text-sm text-muted mb-6">
          {mode === "signin"
            ? "Sign in to your account"
            : "Create your account"}
        </p>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

        {success ? (
          <button
            onClick={close}
            className="w-full py-3 rounded-xl bg-dark text-cream font-medium hover:opacity-90 transition"
          >
            Close
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                tabIndex={-1}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            {mode === "signup" && (
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-dark"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-dark text-cream font-medium hover:opacity-90 transition"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        )}

        <p className="text-sm text-muted text-center mt-6">
          {mode === "signin"
            ? "Don't have an account?"
            : "Already have an account?"}
          <button
            className="ml-1 text-accent font-medium hover:underline"
            onClick={toggle}
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
