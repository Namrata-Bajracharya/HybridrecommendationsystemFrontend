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
import Cookies from 'js-cookie';
import { publicAgent, privateAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authModal, setAuthModal] = useState({ open: false, mode: "signin" });

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

  /* ── signup: add to user registry, log in automatically ── */
  const signup = useCallback(
    async (name, email, password) => {
      try {
        // Use publicAgent for registration (customers only)
        const payload = {
          email,
          password,
          first_name: name,
          last_name: "",
          phone: "",
        };
        await publicAgent.post(UserAPI({}).register, payload);
        // auto-login after register
        const result = await signin(email, password);
        if (result.ok === false) return { ok: false, error: result.error };
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error:
            err.response?.data?.detail || err.message || "Registration failed",
        };
      }
    },
    [signin],
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

  /* ── requireAuth: open modal in requested mode ──
       If user is already signed in, returns true. Otherwise
       opens the auth modal and returns false. This lets callers
       conditionally gate features behind login. */
  const requireAuth = useCallback(
    (mode = "signin") => {
      if (user) return true;
      setAuthModal({ open: true, mode });
      return false;
    },
    [user],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        signin,
        signout,
        requireAuth,
        authModal,
        setAuthModal,
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
