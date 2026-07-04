import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { publicAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("verifying");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    publicAgent.get(UserAPI({}).verify.replace("{token}", token))
      .then(() => setStatus("success"))
      .catch((err) => {
        const d = err.response?.data?.detail || "";
        setDetail(d);
        if (d === "Email already verified") {
          setStatus("already");
        } else {
          setStatus("invalid");
        }
      });
  }, [token]);

  const icon = {
    verifying: "⏳",
    success: "\u2713",
    already: "\u2713",
    invalid: "\u2717",
  }[status];

  const title = {
    verifying: "Verifying...",
    success: "Email Verified!",
    already: "Already Verified",
    invalid: "Invalid or Expired Link",
  }[status];

  const desc = {
    verifying: "Please wait while we verify your email.",
    success: "Your account is now active. You can sign in and complete your profile.",
    already: "This email was already verified. Sign in to continue.",
    invalid: detail === "Email already verified"
      ? "This email was already verified. Sign in to continue."
      : "This verification link is invalid or has expired. Please try registering again.",
  }[status];

  const linkTo = status === "success" ? "/profile/complete"
    : status === "already" ? "/login"
    : "/register";
  const linkText = status === "success" ? "Complete Profile"
    : status === "already" ? "Sign In"
    : "Register Again";

  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className={`w-16 h-16 rounded-full text-3xl flex items-center justify-center mx-auto mb-4 ${
        status === "success" || status === "already" ? "bg-green-100 text-green-600" :
        status === "invalid" ? "bg-red-100 text-red-500" :
        "bg-cream text-muted"
      }`}>
        {icon}
      </div>
      <h1 className="text-2xl font-semibold mb-2">{title}</h1>
      <p className="text-muted text-sm mb-6">{desc}</p>
      {status !== "verifying" && (
        <Link to={linkTo}
          className="inline-block px-6 py-2 bg-dark text-cream rounded-xl text-sm font-medium hover:opacity-90 transition">
          {linkText}
        </Link>
      )}
    </div>
  );
}
