import { useState } from "react";
import { Link } from "react-router-dom";
import { publicAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) return setError("Enter your email");
    setLoading(true);
    try {
      await publicAgent.post(UserAPI({}).forgotPassword, { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto mb-4">&#10003;</div>
        <h1 className="text-2xl font-semibold mb-2">Check Your Email</h1>
        <p className="text-muted text-sm mb-6">If that email is registered, we sent a password reset link.</p>
        <Link to="/login" className="text-accent text-sm hover:underline">Back to Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-4">Forgot Password</h1>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-dark text-cream rounded disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
              Sending…
            </>
          ) : "Send Reset Link"}
        </button>
        <p className="text-xs text-muted text-center">
          Remember your password? <Link to="/login" className="text-accent hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  );
}
