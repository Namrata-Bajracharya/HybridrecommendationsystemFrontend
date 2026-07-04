import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { publicAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!token) return setError("Missing reset token");
    if (!password.trim()) return setError("Enter a new password");
    if (password !== confirm) return setError("Passwords do not match");
    setLoading(true);
    try {
      await publicAgent.post(UserAPI({}).resetPassword, { token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 text-3xl flex items-center justify-center mx-auto mb-4">&#10003;</div>
        <h1 className="text-2xl font-semibold mb-2">Password Reset</h1>
        <p className="text-muted text-sm mb-6">Your password has been updated. You can now sign in.</p>
        <Link to="/login" className="inline-block px-6 py-2 bg-dark text-cream rounded-xl text-sm font-medium hover:opacity-90 transition">Sign In</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-4">Set New Password</h1>
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" placeholder="New password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 rounded" />
        <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-4 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-dark text-cream rounded disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
              Resetting…
            </>
          ) : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
