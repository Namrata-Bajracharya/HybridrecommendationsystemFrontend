import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { privateAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";
import { useSnackbar } from "notistack";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!current.trim() || !newPass.trim()) return enqueueSnackbar("Fill in all fields", { variant: "warning" });
    if (newPass !== confirm) return enqueueSnackbar("New passwords do not match", { variant: "warning" });
    setLoading(true);
    try {
      await privateAgent.post(UserAPI({}).changePassword, { current_password: current, new_password: newPass });
      enqueueSnackbar("Password changed!", { variant: "success" });
      navigate(-1);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || "Failed to change password", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-4">Change Password</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="password" placeholder="Current password" value={current} onChange={e => setCurrent(e.target.value)} className="w-full px-4 py-2 rounded" />
        <input type="password" placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full px-4 py-2 rounded" />
        <input type="password" placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-4 py-2 rounded" />
        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-dark text-cream rounded disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" />
              </svg>
              Changing…
            </>
          ) : "Change Password"}
        </button>
      </form>
    </div>
  );
}
