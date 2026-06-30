/**
 * Custom hook for managing recommendation API calls
 * Handles loading states, errors, and caching
 */
import { useState, useCallback, useEffect } from 'react';
import { privateAgent, publicAgent } from '../Requests/AuthRequests';
import { RecommendationAPI } from '../routes/Routes';

export const useRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  /**
   * Get personalized recommendations for a user
   * @param {string} userId - User ID
   * @param {number} topK - Number of recommendations (default: 10)
   * @param {string[]} excludeIds - Product IDs to exclude
   */
  const getRecommendationsForUser = useCallback(
    async (userId, topK = 10, excludeIds = []) => {
      if (!userId) {
        setError('User ID is required');
        return [];
      }

      const cacheKey = `user_${userId}_${topK}`;
      if (cache[cacheKey]) {
        setRecommendations(cache[cacheKey]);
        return cache[cacheKey];
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = excludeIds.length > 0
          ? RecommendationAPI({ userId }).forUserWithExclude(userId, excludeIds)
          : RecommendationAPI({ userId, topK }).forUser;

        const response = await privateAgent.get(endpoint);
        const data = response.data.recommendations || [];

        setCache(prev => ({ ...prev, [cacheKey]: data }));
        setRecommendations(data);
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch recommendations';
        setError(errorMsg);
        console.error('Error fetching recommendations:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  /**
   * Get products similar to a given product
   * @param {string} productId - Product ID
   * @param {number} topK - Number of similar products (default: 5)
   */
  const getSimilarProducts = useCallback(
    async (productId, topK = 5) => {
      if (!productId) {
        setError('Product ID is required');
        return [];
      }

      const cacheKey = `product_${productId}_${topK}`;
      if (cache[cacheKey]) {
        setSimilarProducts(cache[cacheKey]);
        return cache[cacheKey];
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = RecommendationAPI({ productId, topK }).similarProducts;
        const response = await publicAgent.get(endpoint);
        const data = response.data.similar_products || [];

        setCache(prev => ({ ...prev, [cacheKey]: data }));
        setSimilarProducts(data);
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch similar products';
        setError(errorMsg);
        console.error('Error fetching similar products:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  /**
   * Get recommendations based on cart items
   * @param {string} userId - User ID
   * @param {string[]} cartItems - Array of product IDs in cart
   * @param {number} topK - Number of recommendations (default: 5)
   */
  const getCartRecommendations = useCallback(
    async (userId, cartItems, topK = 5) => {
      if (!userId) {
        setError('User ID is required');
        return [];
      }

      if (!cartItems || cartItems.length === 0) {
        setError('Cart items are required');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = RecommendationAPI().cartBased;
        const response = await privateAgent.post(endpoint, {
          user_id: userId,
          cart_items: cartItems,
          top_k: topK,
        });

        const data = response.data.recommendations || [];
        setRecommendations(data);
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch cart recommendations';
        setError(errorMsg);
        console.error('Error fetching cart recommendations:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get recommendations based on product review
   * @param {string} userId - User ID
   * @param {string} productId - Product ID being reviewed
   * @param {number} rating - User's rating (1-5)
   * @param {number} topK - Number of recommendations (default: 5)
   */
  const getReviewBasedRecommendations = useCallback(
    async (userId, productId, rating, topK = 5) => {
      if (!userId || !productId || !rating) {
        setError('User ID, Product ID, and rating are required');
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = RecommendationAPI().reviewBased;
        const response = await privateAgent.post(endpoint, {
          user_id: userId,
          product_id: productId,
          rating: rating,
          top_k: topK,
        });

        const data = response.data.recommendations || [];
        setRecommendations(data);
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch review-based recommendations';
        setError(errorMsg);
        console.error('Error fetching review-based recommendations:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Get recommendations from users with similar buying patterns
   * @param {string} userId - User ID
   * @param {number} topK - Number of recommendations (default: 10)
   */
  const getSimilarUserRecommendations = useCallback(
    async (userId, topK = 10) => {
      if (!userId) {
        setError('User ID is required');
        return [];
      }

      const cacheKey = `similar_users_${userId}_${topK}`;
      if (cache[cacheKey]) {
        setRecommendations(cache[cacheKey]);
        return cache[cacheKey];
      }

      setLoading(true);
      setError(null);

      try {
        const endpoint = RecommendationAPI({ userId, topK }).similarUsers;
        const response = await privateAgent.get(endpoint);
        const data = response.data.recommendations || [];

        setCache(prev => ({ ...prev, [cacheKey]: data }));
        setRecommendations(data);
        return data;
      } catch (err) {
        const errorMsg = err.response?.data?.detail || 'Failed to fetch similar user recommendations';
        setError(errorMsg);
        console.error('Error fetching similar user recommendations:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  /**
   * Clear recommendation caches
   */
  const clearCache = useCallback(async () => {
    try {
      const endpoint = RecommendationAPI().clearCache;
      await privateAgent.post(endpoint);
      setCache({});
      console.log('Recommendation cache cleared');
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  }, []);

  return {
    // State
    recommendations,
    similarProducts,
    loading,
    error,

    // Methods
    getRecommendationsForUser,
    getSimilarProducts,
    getCartRecommendations,
    getReviewBasedRecommendations,
    getSimilarUserRecommendations,
    clearCache,
  };
};

export default useRecommendations;
