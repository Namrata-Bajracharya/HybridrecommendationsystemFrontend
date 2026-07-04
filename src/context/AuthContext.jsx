/* ── AuthContext ──
   Provides signup, signin, signout, and requireAuth across the app.
   Credentials are stored in localStorage (kalleenepal_users, kalleenepal_session).
   ⚠️ Plain-text password — for demo only; in production use bcrypt/hash. */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';
import { publicAgent, privateAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  /* ── On mount: hydrate session from localStorage ── */
  useEffect(() => {
    const token = localStorage.getItem("kalleenepal_token");
    const stored = localStorage.getItem("kalleenepal_session");
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("kalleenepal_session");
      }
    }
  }, []);

  /* ── signin: verify credentials against registry ── */
  const signin = useCallback(async (email, password) => {
    try {
      // Use publicAgent for login
      const resp = await publicAgent.post(UserAPI({}).login, {
        email,
        password,
      });
      const token = resp.data?.token;
      const refreshToken = resp.data?.refresh_token;
      const userFromResp = resp.data?.user;
      if (!token) return { ok: false, error: "Invalid login response" };
      // persist tokens where interceptors read them
      localStorage.setItem("kalleenepal_token", token);
      Cookies.set('token', token, { sameSite: 'Strict' });
      if (refreshToken) {
        localStorage.setItem("kalleenepal_refresh_token", refreshToken);
        Cookies.set('refreshToken', refreshToken, { sameSite: 'Strict' });
      }
      // use returned user if provided, otherwise fetch /me as fallback
      let u = userFromResp;
      if (!u) {
        const meResp = await privateAgent.get(UserAPI({}).getMe);
        u = meResp.data;
      }
      if (u) {
        localStorage.setItem("kalleenepal_session", JSON.stringify(u));
        setUser(u);
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.detail || err.message || "Login failed",
      };
    }
  }, []);

  /* ── signup: register user, send verification email ── */
  const signup = useCallback(
    async (email, password) => {
      try {
        await publicAgent.post(UserAPI({}).register, { email, password });
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err.response?.data?.detail || err.message || "Registration failed",
        };
      }
    },
    [],
  );

  /* ── signout: notify backend, clear session, reset user state ── */
  const signout = useCallback(async () => {
    try {
      // ask backend to clear any server-side session/cookies
      await privateAgent.post(UserAPI({}).logout);
    } catch (err) {
      // ignore network/errors — still clear client state
    }
    localStorage.removeItem("kalleenepal_session");
    localStorage.removeItem("kalleenepal_token");
    localStorage.removeItem("kalleenepal_refresh_token");
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    setUser(null);
    // reload so pages relying on auth state update correctly
    try {
      window.location.href = "/login";
    } catch {}
  }, []);

  /* ── requireAuth: redirect to /login if not signed in ── */
  const requireAuth = useCallback(
    () => {
      if (user) return true;
      navigate("/login");
      return false;
    },
    [user, navigate],
  );

  const isProfileComplete = user && user.first_name && user.last_name;

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        signin,
        signout,
        requireAuth,
        isProfileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
