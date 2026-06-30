/**
 * Recommendation Engine Demo & Test Page
 * Showcases all recommendation API endpoints and hooks
 * - Personalized recommendations
 * - Similar products
 * - Cart-based recommendations
 * - Review-based recommendations
 * - Similar user recommendations
 */
import { useState, useEffect } from 'react';
import useRecommendations from '../hooks/useRecommendations';
import { RecommendationAPI } from '../routes/Routes';

export default function RecommendationDemo() {
  const {
    recommendations,
    similarProducts,
    loading,
    error,
    getRecommendationsForUser,
    getSimilarProducts,
    getCartRecommendations,
    getReviewBasedRecommendations,
    getSimilarUserRecommendations,
  } = useRecommendations();

  // Form states
  const [userId, setUserId] = useState('user_123');
  const [productId, setProductId] = useState('amazon::B07XVD1RR7');
  const [cartItems, setCartItems] = useState('amazon::B07XVD1RR7,hm::123456');
  const [rating, setRating] = useState(5);
  const [topK, setTopK] = useState(5);
  const [successMessage, setSuccessMessage] = useState('');

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // ============ Handler Functions ============

  const handleGetUserRecommendations = async () => {
    const data = await getRecommendationsForUser(userId, topK);
    if (data.length > 0) {
      setSuccessMessage(`✅ Loaded ${data.length} personalized recommendations`);
    }
  };

  const handleGetSimilarProducts = async () => {
    const data = await getSimilarProducts(productId, topK);
    if (data.length > 0) {
      setSuccessMessage(`✅ Found ${data.length} similar products`);
    }
  };

  const handleGetCartRecommendations = async () => {
    const items = cartItems.split(',').map(item => item.trim());
    const data = await getCartRecommendations(userId, items, topK);
    if (data.length > 0) {
      setSuccessMessage(`✅ Loaded ${data.length} cart-based recommendations`);
    }
  };

  const handleGetReviewRecommendations = async () => {
    const data = await getReviewBasedRecommendations(userId, productId, rating, topK);
    if (data.length > 0) {
      setSuccessMessage(`✅ Loaded ${data.length} review-based recommendations`);
    }
  };

  const handleGetSimilarUserRecommendations = async () => {
    const data = await getSimilarUserRecommendations(userId, topK);
    if (data.length > 0) {
      setSuccessMessage(`✅ Loaded ${data.length} similar user recommendations`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">🎯 Hybrid Recommendation Engine</h1>
          <p className="text-lg text-slate-600">
            Demo & Testing for ML-powered product recommendations
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {loading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">⏳ Loading recommendations...</p>
          </div>
        )}

        {/* Input Controls */}
        <div className="mb-12 bg-white rounded-lg shadow p-8 border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">User ID</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., user_123"
              />
              <p className="text-xs text-slate-500 mt-1">User identifier for personalized recommendations</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Product ID</label>
              <input
                type="text"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., amazon::B07XVD1RR7"
              />
              <p className="text-xs text-slate-500 mt-1">Format: source::productId</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Cart Items (comma-separated)</label>
              <input
                type="text"
                value={cartItems}
                onChange={(e) => setCartItems(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., amazon::B07XVD1RR7,hm::123456"
              />
              <p className="text-xs text-slate-500 mt-1">Product IDs in user's shopping cart</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Rating (1-5)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5].map(r => (
                    <option key={r} value={r}>{r} ⭐</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Top K Results</label>
                <input
                  type="number"
                  value={topK}
                  onChange={(e) => setTopK(Math.max(1, Math.min(50, parseInt(e.target.value))))}
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recommendation Endpoints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. Personalized Recommendations */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-slate-900 mb-2">👤 Personalized Recommendations</h3>
            <p className="text-slate-600 text-sm mb-4">
              Recommendations based on user's purchase history, behavior patterns, and item popularity
            </p>
            <button
              onClick={handleGetUserRecommendations}
              disabled={loading || !userId}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Get Recommendations
            </button>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">API Endpoint:</p>
              <code className="block bg-slate-100 p-2 rounded text-xs text-slate-700 break-all">
                GET /recommendations/for-user/&#123;user_id&#125;?top_k=10
              </code>
            </div>
          </div>

          {/* 2. Similar Products */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-slate-900 mb-2">🔗 Similar Products</h3>
            <p className="text-slate-600 text-sm mb-4">
              Products similar by content features and collaborative signals (people who bought X also bought Y)
            </p>
            <button
              onClick={handleGetSimilarProducts}
              disabled={loading || !productId}
              className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Find Similar Products
            </button>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">API Endpoint:</p>
              <code className="block bg-slate-100 p-2 rounded text-xs text-slate-700 break-all">
                GET /recommendations/similar-products/&#123;product_id&#125;?top_k=5
              </code>
            </div>
          </div>

          {/* 3. Cart-Based Recommendations */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-slate-900 mb-2">🛒 Cart-Based Recommendations</h3>
            <p className="text-slate-600 text-sm mb-4">
              Complementary products frequently purchased together with items in user's cart
            </p>
            <button
              onClick={handleGetCartRecommendations}
              disabled={loading || !cartItems}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Get Cart Recommendations
            </button>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">API Endpoint:</p>
              <code className="block bg-slate-100 p-2 rounded text-xs text-slate-700 break-all">
                POST /recommendations/cart-items
              </code>
            </div>
          </div>

          {/* 4. Review-Based Recommendations */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-lg transition">
            <h3 className="text-xl font-bold text-slate-900 mb-2">⭐ Review-Based Recommendations</h3>
            <p className="text-slate-600 text-sm mb-4">
              Smart recommendations based on product ratings (similar if high, alternatives if low)
            </p>
            <button
              onClick={handleGetReviewRecommendations}
              disabled={loading || !userId || !productId}
              className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Get Review Recommendations
            </button>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">API Endpoint:</p>
              <code className="block bg-slate-100 p-2 rounded text-xs text-slate-700 break-all">
                POST /recommendations/review-based
              </code>
            </div>
          </div>

          {/* 5. Similar User Recommendations */}
          <div className="bg-white rounded-lg shadow p-6 border border-slate-200 hover:shadow-lg transition lg:col-span-2">
            <h3 className="text-xl font-bold text-slate-900 mb-2">👥 Similar User Recommendations</h3>
            <p className="text-slate-600 text-sm mb-4">
              Hybrid collaborative filtering: finds users with similar buying patterns and recommends their purchases
            </p>
            <button
              onClick={handleGetSimilarUserRecommendations}
              disabled={loading || !userId}
              className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Get Similar User Recommendations
            </button>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-slate-600 uppercase">API Endpoint:</p>
              <code className="block bg-slate-100 p-2 rounded text-xs text-slate-700 break-all">
                GET /recommendations/similar-users/&#123;user_id&#125;?top_k=10
              </code>
            </div>
          </div>
        </div>

        {/* Results */}
        {recommendations.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow p-8 border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">📊 Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Rank</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Product ID</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Score</th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-900">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recommendations.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-900 font-medium">#{rec.rank}</td>
                      <td className="px-6 py-4 text-slate-700 font-mono text-xs">{rec.item_id}</td>
                      <td className="px-6 py-4">
                        <div className="w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full"
                            style={{ width: `${rec.score * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-600">{(rec.score * 100).toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{rec.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* System Information */}
        <div className="mt-12 bg-slate-50 rounded-lg p-6 border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">ℹ️ System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="font-semibold">Model Features:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Item popularity (purchase frequency)</li>
                <li>Content similarity scores</li>
                <li>User interaction patterns</li>
                <li>Collaborative signals</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold">Recommendation Types:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Personalized (user-based)</li>
                <li>Content-based (product features)</li>
                <li>Collaborative (user similarity)</li>
                <li>Context-aware (cart, reviews)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
