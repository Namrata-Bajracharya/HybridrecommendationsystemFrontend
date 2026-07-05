import { useState, useEffect, useCallback, useRef } from "react";
import { privateAgent, publicAgent } from "../Requests/AuthRequests";
import { BASE_API_ROUTE } from "../routes/Routes";
import { io } from "socket.io-client";

const LS_ACTIONS = "kalleenepal_testrec_actions";
const LS_VIEWED = "kalleenepal_testrec_viewed";
const LS_CART = "kalleenepal_testrec_cart";
const LS_WISHLIST = "kalleenepal_testrec_wishlist";
const TEST_KEYS = [LS_VIEWED, LS_CART, LS_WISHLIST];

function loadSavedActions(userId) {
  try {
    const raw = localStorage.getItem(`${LS_ACTIONS}_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function toggleId(key, productId) {
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const pid = String(productId);
  const idx = current.indexOf(pid);
  if (idx >= 0) current.splice(idx, 1);
  else current.push(pid);
  localStorage.setItem(key, JSON.stringify(current));
  return idx < 0;
}

function getIds(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const AUTH_STATE_CLASSES = {
  normal: "border-gray-200 bg-white",
  buy: "border-green-500 bg-green-50",
  cancel: "border-red-500 bg-red-50",
  return: "border-amber-500 bg-amber-50",
  positive_review: "border-teal-500 bg-teal-50",
  negative_review: "border-rose-500 bg-rose-50",
  high_rating: "border-sky-500 bg-sky-50",
  low_rating: "border-red-500 bg-red-50",
};

function getSessionId() {
  let sid = localStorage.getItem("kalleenepal_testrec_session");
  if (!sid) {
    sid =
      crypto.randomUUID?.() ||
      Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("kalleenepal_testrec_session", sid);
  }
  return sid;
}

function addSessionParam(params) {
  params.set("session_id", getSessionId());
}

async function refreshRecs(agent, viewedIds, cartIds, wishIds) {
  const params = new URLSearchParams({ page: "1", per_page: "100" });
  addSessionParam(params);
  if (cartIds.length) params.set("cart_ids", cartIds.join(","));
  if (viewedIds.length) params.set("viewed_ids", viewedIds.join(","));
  if (wishIds.length) params.set("wishlist_ids", wishIds.join(","));
  const res = await agent.get(
    `${BASE_API_ROUTE}/testrecommendation/refresh?${params}`,
  );
  return res.data.recommendations || [];
}

export default function TestRecommendation() {
  const [products, setProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [actions, setActions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [viewed, setViewed] = useState(() => getIds(LS_VIEWED));
  const [cartTest, setCartTest] = useState(() => getIds(LS_CART));
  const [wishlist, setWishlist] = useState(() => getIds(LS_WISHLIST));
  const [refreshCounter, setRefreshCounter] = useState(0);
  const clickTimers = useRef({});
  const clickCounts = useRef({});

  const session = localStorage.getItem("kalleenepal_session");
  const userId = session ? JSON.parse(session)?.id : null;

  // ── Cross-tab sync via localStorage change events ──
  useEffect(() => {
    const onStorage = (e) => {
      if (!TEST_KEYS.includes(e.key)) return;
      if (e.key === LS_VIEWED) setViewed(getIds(LS_VIEWED));
      if (e.key === LS_CART) setCartTest(getIds(LS_CART));
      if (e.key === LS_WISHLIST) setWishlist(getIds(LS_WISHLIST));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Socket.IO: real-time cross-device sync ──
  useEffect(() => {
    const socket = io("http://localhost:8000", {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    socket.on("connect", () => {
      socket.emit("join_testrec", { session_id: getSessionId() });
    });

    socket.on("message", (data) => {
      if (data?.type === "testrec_update" || data?.type === "testrec_reload") {
        setRefreshCounter((c) => c + 1);
      }
    });

    return () => { socket.removeAllListeners(); socket.close(); };
  }, []);

  // ── Re-fetch recommendations whenever state changes or global refresh fires ──
  useEffect(() => {
    if (loading) return;
    const agent = userId ? privateAgent : publicAgent;
    refreshRecs(agent, viewed, cartTest, wishlist).then(setRecommendations);
  }, [viewed, cartTest, wishlist, userId, loading, refreshCounter]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const agent = userId ? privateAgent : publicAgent;
      const params = new URLSearchParams({ page: "1", per_page: "100" });
      addSessionParam(params);
      const initialViewed = getIds(LS_VIEWED);
      const initialCart = getIds(LS_CART);
      const initialWish = getIds(LS_WISHLIST);
      if (initialCart.length) params.set("cart_ids", initialCart.join(","));
      if (initialViewed.length) params.set("viewed_ids", initialViewed.join(","));
      if (initialWish.length) params.set("wishlist_ids", initialWish.join(","));

      const res = await agent.get(
        `${BASE_API_ROUTE}/testrecommendation?${params}`,
      );
      const data = res.data;
      setProducts(data.products?.data || []);
      setRecommendations(data.recommendations || []);
      setIsAuth(data.is_authenticated || false);

      // Recommendations returned by backend already factor in the session's
      // cross-device state, but each device keeps its own button state independent.

      if (userId) {
        const saved = loadSavedActions(userId);
        setActions({ ...saved, ...(data.actions || {}) });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getState = (productId) => actions[productId] || "normal";

  // ── Auth: send explicit action to backend ──
  const handleAuthAction = useCallback(
    async (productId, action) => {
      const newActions = { ...actions, [productId]: action };
      setActions(newActions);

      await privateAgent.post(`${BASE_API_ROUTE}/testrecommendation/action`, {
        product_id: String(productId),
        action,
      });

      setRefreshCounter((c) => c + 1);
    },
    [actions],
  );

  // ── Auth: click-cycle (single=buy, double=cancel, triple=normal) ──
  const processClick = useCallback(
    async (productId) => {
      const count = clickCounts.current[productId] || 0;
      delete clickCounts.current[productId];

      toggleId(LS_VIEWED, productId);
      setViewed(getIds(LS_VIEWED));

      const actionMap = { 1: "buy", 2: "cancel", 3: "normal" };
      const action = actionMap[count] || "normal";
      const newActions = { ...actions, [productId]: action };
      setActions(newActions);

      await privateAgent.post(`${BASE_API_ROUTE}/testrecommendation/action`, {
        product_id: String(productId),
        action,
      });
    },
    [actions],
  );

  const handleRowClick = useCallback(
    (productId, event) => {
      if (!isAuth) return;
      event.preventDefault();
      event.stopPropagation();
      clickCounts.current[productId] =
        (clickCounts.current[productId] || 0) + 1;
      if (clickTimers.current[productId])
        clearTimeout(clickTimers.current[productId]);
      clickTimers.current[productId] = setTimeout(
        () => processClick(productId),
        300,
      );
    },
    [isAuth, processClick],
  );

  // ── Toggle actions (testing-only, does NOT affect real cart/wishlist) ──
  const handleViewToggle = useCallback((productId) => {
    toggleId(LS_VIEWED, productId);
    setViewed(getIds(LS_VIEWED));
  }, []);

  const handleCartToggle = useCallback((productId) => {
    toggleId(LS_CART, productId);
    setCartTest(getIds(LS_CART));
  }, []);

  const handleWishlistToggle = useCallback((productId) => {
    toggleId(LS_WISHLIST, productId);
    setWishlist(getIds(LS_WISHLIST));
  }, []);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Test Recommendation Engine
            </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isAuth ? (
                    <>
                      Click row: single=
                      <span className="text-green-600 font-medium">Buy</span> |
                      double=
                      <span className="text-red-600 font-medium">Cancel</span> |
                      triple=
                      <span className="text-gray-600 font-medium">Normal</span>
                      {" · "}Use explicit buttons below for{" "}
                      <span className="text-purple-600 font-medium">Return</span>,{" "}
                      <span className="text-teal-600 font-medium">Reviews</span>, &{" "}
                      <span className="text-indigo-600 font-medium">Ratings</span>
                    </>
                  ) : (
                    <>
                      Toggle buttons to test how recommendations change with{" "}
                      <span className="text-blue-600 font-medium">View</span>,{" "}
                      <span className="text-orange-600 font-medium">Cart</span>, &{" "}
                      <span className="text-pink-600 font-medium">Wishlist</span>
                    </>
                  )}
                  <span className="text-gray-400 ml-2">
                    {" "}
                    syncs across tabs & browsers automatically
                  </span>
                </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAuth && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                Guest Mode
              </span>
            )}
            <button
              onClick={() => navigator.clipboard.writeText(getSessionId())}
              className="text-[10px] text-gray-400 hover:text-gray-600 underline"
              title="Copy session ID for cross-device sync"
            >
              📋 Session
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── LEFT: Products ── */}
          <div className="w-1/2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              All Products
            </h2>
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-2">
              {products.map((p) => {
                const state = getState(p.id);
                const isViewed = viewed.includes(String(p.id));
                const inCart = cartTest.includes(String(p.id));
                const inWish = wishlist.includes(String(p.id));
                return (
                  <div
                    key={p.id}
                    className={`rounded-lg border transition-all duration-150 ${
                      isAuth
                        ? AUTH_STATE_CLASSES[state]
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    {/* Main row — clickable for auth buy/cancel cycle */}
                    <div
                      onClick={(e) => handleRowClick(p.id, e)}
                      className={`flex items-center gap-3 p-3 ${isAuth ? "cursor-pointer" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-lg font-bold shrink-0 ${
                          isAuth && state === "buy"
                            ? "bg-green-500 text-white"
                            : isAuth && state === "cancel"
                              ? "bg-red-500 text-white"
                              : isAuth && state === "return"
                                ? "bg-amber-500 text-white"
                                : isAuth && state === "positive_review"
                                  ? "bg-teal-500 text-white"
                                  : isAuth && state === "negative_review"
                                    ? "bg-rose-500 text-white"
                                    : isAuth && state === "high_rating"
                                      ? "bg-sky-500 text-white"
                                      : isAuth && state === "low_rating"
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isAuth && state === "buy"
                          ? "✓"
                          : isAuth && state === "cancel"
                            ? "✗"
                            : isAuth && state === "return"
                              ? "↩"
                              : isAuth && state === "positive_review"
                                ? "👍"
                                : isAuth && state === "negative_review"
                                  ? "👎"
                                  : isAuth && state === "high_rating"
                                    ? "★"
                                    : isAuth && state === "low_rating"
                                      ? "☆"
                                      : p.emoji || "📷"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {p.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rs {Number(p.price).toLocaleString()}
                        </p>
                      </div>
                      {isAuth && state !== "normal" && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            state === "buy"
                              ? "bg-green-100 text-green-700"
                              : state === "cancel"
                                ? "bg-red-100 text-red-700"
                                : state === "return"
                                  ? "bg-amber-100 text-amber-700"
                                  : state === "positive_review"
                                    ? "bg-teal-100 text-teal-700"
                                    : state === "negative_review"
                                      ? "bg-rose-100 text-rose-700"
                                      : state === "high_rating"
                                        ? "bg-sky-100 text-sky-700"
                                        : state === "low_rating"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {state === "buy"
                            ? "Bought"
                            : state === "cancel"
                              ? "Cancelled"
                              : state === "return"
                                ? "Returned"
                                : state === "positive_review"
                                  ? "Pos Review"
                                  : state === "negative_review"
                                    ? "Neg Review"
                                    : state === "high_rating"
                                      ? "High Rate"
                                      : state === "low_rating"
                                        ? "Low Rate"
                                        : state}
                        </span>
                      )}
                    </div>

                    {/* Action buttons — single-click toggle for all */}
                    <div className="flex gap-1 px-3 pb-3">
                      <button
                        onClick={() => handleViewToggle(p.id)}
                        className={`flex-1 text-xs py-1.5 rounded font-medium transition ${
                          isViewed
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {isViewed ? "Viewed" : "View"}
                      </button>
                      <button
                        onClick={() => handleCartToggle(p.id)}
                        className={`flex-1 text-xs py-1.5 rounded font-medium transition ${
                          inCart
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                        }`}
                      >
                        {inCart ? "In Cart" : "Add to Cart"}
                      </button>
                      <button
                        onClick={() => handleWishlistToggle(p.id)}
                        className={`flex-1 text-xs py-1.5 rounded font-medium transition ${
                          inWish
                            ? "bg-pink-100 text-pink-700"
                            : "bg-gray-100 text-gray-600 hover:bg-pink-50 hover:text-pink-600"
                        }`}
                      >
                        {inWish ? "♥ Wishlisted" : "♡ Wishlist"}
                      </button>
                    </div>

                    {/* Auth-specific action buttons */}
                    {isAuth && (
                      <div className="flex gap-1 px-3 pb-3 flex-wrap">
                        <button
                          onClick={() => handleAuthAction(p.id, state === "buy" ? "normal" : "buy")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "buy"
                              ? "bg-green-200 text-green-800 ring-1 ring-green-400"
                              : "bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600"
                          }`}
                        >
                          {state === "buy" ? "✓ Bought" : "Buy"}
                        </button>
                        <button
                          onClick={() => handleAuthAction(p.id, state === "return" ? "normal" : "return")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "return"
                              ? "bg-amber-200 text-amber-800 ring-1 ring-amber-400"
                              : "bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600"
                          }`}
                        >
                          {state === "return" ? "↩ Returned" : "Return"}
                        </button>
                        <button
                          onClick={() => handleAuthAction(p.id, state === "positive_review" ? "normal" : "positive_review")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "positive_review"
                              ? "bg-teal-200 text-teal-800 ring-1 ring-teal-400"
                              : "bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                          }`}
                        >
                          {state === "positive_review" ? "👍 Pos Review" : "Pos Review"}
                        </button>
                        <button
                          onClick={() => handleAuthAction(p.id, state === "negative_review" ? "normal" : "negative_review")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "negative_review"
                              ? "bg-rose-200 text-rose-800 ring-1 ring-rose-400"
                              : "bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                          }`}
                        >
                          {state === "negative_review" ? "👎 Neg Review" : "Neg Review"}
                        </button>
                        <button
                          onClick={() => handleAuthAction(p.id, state === "high_rating" ? "normal" : "high_rating")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "high_rating"
                              ? "bg-sky-200 text-sky-800 ring-1 ring-sky-400"
                              : "bg-gray-100 text-gray-500 hover:bg-sky-50 hover:text-sky-600"
                          }`}
                        >
                          {state === "high_rating" ? "★ High Rate" : "High Rate"}
                        </button>
                        <button
                          onClick={() => handleAuthAction(p.id, state === "low_rating" ? "normal" : "low_rating")}
                          className={`text-[10px] py-1 px-2 rounded font-medium transition ${
                            state === "low_rating"
                              ? "bg-red-200 text-red-800 ring-1 ring-red-400"
                              : "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          }`}
                        >
                          {state === "low_rating" ? "★ Low Rate" : "Low Rate"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Recommendations ── */}
          <div className="w-1/2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Recommendations
              {recommendations.length > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  ({recommendations.length})
                </span>
              )}
            </h2>
            <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
              {recommendations.length === 0 ? (
                <div className="text-sm text-gray-400 italic p-4 bg-gray-50 rounded-lg">
                  Toggle buttons on products to generate recommendations...
                </div>
              ) : (
                recommendations.map((rec) => {
                  const product = products.find(
                    (p) => String(p.id) === rec.item_id,
                  );
                  return (
                    <div
                      key={rec.item_id}
                      className="flex items-center gap-4 p-3 rounded-lg border border-blue-100 bg-blue-50/50"
                    >
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-sm font-bold shrink-0">
                        #{rec.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product?.name || `Product #${rec.item_id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product
                            ? `Rs ${Number(product.price).toLocaleString()}`
                            : ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-24 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full"
                              style={{
                                width: `${Math.min(rec.score * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {(rec.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
