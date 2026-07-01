// Parameter interface-like object definition
const paramInterface = {
  id: undefined,
  pageNum: undefined,
  searchTerm: undefined,
  RecordPerPage: undefined,
  token: undefined,
  type: undefined,
  reminderOption: {
    reminderId: undefined,
    reminderType: undefined,
    noteId: undefined,
  },
};

// API Configuration
export const HOST_URL = "http://localhost:8000";
const ROOT_ROUTE = "/api/v1";
export const BASE_API_ROUTE = HOST_URL + ROOT_ROUTE;

// Routes Object
export const routesName = {
  // ============ USER ROUTES ============
  UserRoute({ id, pageNum, RecordPerPage, searchTerm } = {}) {
    return {
      register: `${BASE_API_ROUTE}/users/register`,
      logout: `${BASE_API_ROUTE}/users/logout`,
      login: `${BASE_API_ROUTE}/users/login`,
      getMe: `${BASE_API_ROUTE}/users/me`,
      updateMe: `${BASE_API_ROUTE}/users/me`,
      deleteMe: `${BASE_API_ROUTE}/users/me`,
      addAddress: `${BASE_API_ROUTE}/users/me/address`,
      getAddresses: `${BASE_API_ROUTE}/users/me/addresses`,
      updateAddress: id ? `${BASE_API_ROUTE}/users/me/address/${id}` : `${BASE_API_ROUTE}/users/me/address`,
      deleteAddress: id ? `${BASE_API_ROUTE}/users/me/address/${id}` : `${BASE_API_ROUTE}/users/me/address`,
      refreshToken: `${BASE_API_ROUTE}/users/refresh`,
    };
  },

  // ============ COLLECTION ROUTES ============
  CollectionRoute({ id, slug } = {}) {
    return {
      create: `${BASE_API_ROUTE}/collection`,
      getAll: `${BASE_API_ROUTE}/collection`,
      getBySlug: slug ? `${BASE_API_ROUTE}/collection/${slug}` : `${BASE_API_ROUTE}/collection`,
      update: id ? `${BASE_API_ROUTE}/collection/${id}` : `${BASE_API_ROUTE}/collection`,
      delete: id ? `${BASE_API_ROUTE}/collection/${id}` : `${BASE_API_ROUTE}/collection`,
    };
  },

  // ============ CATEGORY ROUTES ============
  CategoryRoute({ id, searchTerm } = {}) {
    return {
      create: `${BASE_API_ROUTE}/category`,
      getAll: `${BASE_API_ROUTE}/category`,
      getTree: `${BASE_API_ROUTE}/category/tree`,
      getById: id ? `${BASE_API_ROUTE}/category/${id}` : `${BASE_API_ROUTE}/category`,
      getBySlug: `${BASE_API_ROUTE}/category/${searchTerm || "slug"}`,
      update: id ? `${BASE_API_ROUTE}/category/${id}` : `${BASE_API_ROUTE}/category`,
      delete: id ? `${BASE_API_ROUTE}/category/${id}` : `${BASE_API_ROUTE}/category`,
    };
  },

  // ============ PRODUCT ROUTES ============
  ProductRoute({ id, pageNum = 1, RecordPerPage = 10, searchTerm } = {}) {
    return {
      create: `${BASE_API_ROUTE}/product`,
      getAll: `${BASE_API_ROUTE}/product?page=${pageNum}&per_page=${RecordPerPage}${
        searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""
      }`,
      getByFilters: `${BASE_API_ROUTE}/product?page=${pageNum}&per_page=${RecordPerPage}&search=${
        searchTerm || ""
      }`,
      autocomplete: `${BASE_API_ROUTE}/product/autocomplete?q=${searchTerm || ""}`,
      getByCategory: `${BASE_API_ROUTE}/product/category/${searchTerm || "slug"}`,
      getById: id ? `${BASE_API_ROUTE}/product/id/${id}` : `${BASE_API_ROUTE}/product/id`,
      getBySlug: `${BASE_API_ROUTE}/product/${searchTerm || "slug"}`,
      update: id ? `${BASE_API_ROUTE}/product/${id}` : `${BASE_API_ROUTE}/product`,
      delete: id ? `${BASE_API_ROUTE}/product/${id}` : `${BASE_API_ROUTE}/product`,
    };
  },

  // ============ CART ROUTES ============
  CartRoute({ id } = {}) {
    return {
      getCart: `${BASE_API_ROUTE}/cart`,
      addItem: `${BASE_API_ROUTE}/cart/items`,
      updateItem: id ? `${BASE_API_ROUTE}/cart/items/${id}` : `${BASE_API_ROUTE}/cart/items`,
      removeItem: id ? `${BASE_API_ROUTE}/cart/items/${id}` : `${BASE_API_ROUTE}/cart/items`,
    };
  },

  // ============ ORDER ROUTES ============
  OrderRoute({ id } = {}) {
    return {
      create: `${BASE_API_ROUTE}/order`,
      getAll: `${BASE_API_ROUTE}/order`,
      getById: id ? `${BASE_API_ROUTE}/order/${id}` : `${BASE_API_ROUTE}/order`,
    };
  },

  // ============ REVIEW ROUTES ============
  ReviewRoute({ id, pageNum = 0, RecordPerPage = 100 } = {}) {
    return {
      create: `${BASE_API_ROUTE}/reviews`,
      getByProduct: `${BASE_API_ROUTE}/reviews/product/${id || "productId"}?skip=${pageNum}&limit=${RecordPerPage}`,
      getById: `${BASE_API_ROUTE}/reviews/${id || "reviewId"}`,
      update: `${BASE_API_ROUTE}/reviews/${id || "reviewId"}`,
      delete: `${BASE_API_ROUTE}/reviews/${id || "reviewId"}`,
    };
  },

  // ============ PAYMENT ROUTES ============
  PaymentRoute() {
    return {
      createIntent: `${BASE_API_ROUTE}/payments/create-intent`,
      webhook: `${BASE_API_ROUTE}/payments/webhook`,
    };
  },

  // ============ WISHLIST ROUTES ============
  WishlistRoute({ id } = {}) {
    return {
      getWishlist: `${BASE_API_ROUTE}/wishlist`,
      addProduct: `${BASE_API_ROUTE}/wishlist`,
      removeProduct: id ? `${BASE_API_ROUTE}/wishlist/${id}` : `${BASE_API_ROUTE}/wishlist`,
      clearWishlist: `${BASE_API_ROUTE}/wishlist`,
      getCount: `${BASE_API_ROUTE}/wishlist/count`,
      moveToCart: id ? `${BASE_API_ROUTE}/wishlist/${id}/move-to-cart` : `${BASE_API_ROUTE}/wishlist/move-to-cart`,
    };
  },

  // ============ ADMIN ROUTES ============
  AdminRoute({ id, pageNum = 1, RecordPerPage = 20, type } = {}) {
    return {
      // Dashboard & Analytics
      getDashboard: `${BASE_API_ROUTE}/admin/dashboard`,
      getSalesAnalytics: `${BASE_API_ROUTE}/admin/analytics/sales`,
      getUserAnalytics: `${BASE_API_ROUTE}/admin/analytics/users`,
      getProductAnalytics: `${BASE_API_ROUTE}/admin/analytics/products`,
      getReviewAnalytics: `${BASE_API_ROUTE}/admin/analytics/reviews`,

      // User Management
      listAllUsers: `${BASE_API_ROUTE}/admin/users?page=${pageNum}&page_size=${RecordPerPage}`,
      updateUserRole: id ? `${BASE_API_ROUTE}/admin/users/${id}/role` : `${BASE_API_ROUTE}/admin/users`,

      // Order Management
      listAllOrders: `${BASE_API_ROUTE}/admin/orders?page=${pageNum}&page_size=${RecordPerPage}`,
      updateOrderStatus: id ? `${BASE_API_ROUTE}/admin/orders/${id}/status` : `${BASE_API_ROUTE}/admin/orders`,
      markOrderShipped: id ? `${BASE_API_ROUTE}/admin/orders/${id}/shipping` : `${BASE_API_ROUTE}/admin/orders`,

      // Review Moderation
      getReviewsForModeration: `${BASE_API_ROUTE}/admin/reviews?page=${pageNum}&page_size=${RecordPerPage}`,
      approveReview: id ? `${BASE_API_ROUTE}/admin/reviews/${id}/approve` : `${BASE_API_ROUTE}/admin/reviews`,
      rejectReview: id ? `${BASE_API_ROUTE}/admin/reviews/${id}/reject` : `${BASE_API_ROUTE}/admin/reviews`,

      // Inventory Management
      getInventoryAlerts: `${BASE_API_ROUTE}/admin/inventory/alerts`,
      updateInventoryBulk: `${BASE_API_ROUTE}/admin/inventory/bulk-update`,
    };
  },

  // ============ RECOMMENDATION ROUTES ============
  RecommendationRoute({ userId, productId, topK = 10 } = {}) {
    return {
      // Personalized recommendations for user
      forUser: `${BASE_API_ROUTE}/recommendations/for-user/${userId || "userId"}?top_k=${topK}`,
      forUserWithExclude: (uid, exclude) => `${BASE_API_ROUTE}/recommendations/for-user/${uid}?top_k=${topK}&exclude_ids=${encodeURIComponent(exclude.join(","))}`,
      
      // Similar products to a given product
      similarProducts: `${BASE_API_ROUTE}/recommendations/similar-products/${productId || "productId"}?top_k=${topK}`,
      
      // Recommendations based on cart items
      cartBased: `${BASE_API_ROUTE}/recommendations/cart-items`,
      
      // Recommendations based on product review/rating
      reviewBased: `${BASE_API_ROUTE}/recommendations/review-based`,
      
      // Recommendations from users with similar buying patterns
      similarUsers: `${BASE_API_ROUTE}/recommendations/similar-users/${userId || "userId"}?top_k=${topK}`,
      
      // Clear recommendation cache
      clearCache: `${BASE_API_ROUTE}/recommendations/clear-cache`,
    };
  },

  // ============ HEALTHCHECK ROUTES ============
  HealthRoute() {
    return {
      check: `${BASE_API_ROUTE}/healthcheck`,
    };
  },

  // ============ ELASTIC/SEARCH ROUTES ============
  ElasticRoute({ searchTerm } = {}) {
    return {
      health: `${BASE_API_ROUTE}/elastic/health`,
      search: `${BASE_API_ROUTE}/elastic/search`,
      suggest: `${BASE_API_ROUTE}/elastic/suggest?text=${searchTerm || ""}`,
    };
  },

  // ============ TEST ROUTES ============
  TestRoute() {
    return {
      healthCheck: `${BASE_API_ROUTE}/test/health`,
      getAllUsers: `${BASE_API_ROUTE}/test/users`,
      // CRUD Operations
      crud: {
        getAllItems: `${BASE_API_ROUTE}/test/crud/items`,
        createItem: `${BASE_API_ROUTE}/test/crud/items`,
        getItem: (id) => `${BASE_API_ROUTE}/test/crud/items/${id}`,
        updateItem: (id) => `${BASE_API_ROUTE}/test/crud/items/${id}`,
        deleteItem: (id) => `${BASE_API_ROUTE}/test/crud/items/${id}`,
      },
    };
  },
};

// Export individual route functions for convenience
export const UserAPI = routesName.UserRoute;
export const CollectionAPI = routesName.CollectionRoute;
export const CategoryAPI = routesName.CategoryRoute;
export const ProductAPI = routesName.ProductRoute;
export const CartAPI = routesName.CartRoute;
export const OrderAPI = routesName.OrderRoute;
export const ReviewAPI = routesName.ReviewRoute;
export const PaymentAPI = routesName.PaymentRoute;
export const WishlistAPI = routesName.WishlistRoute;
export const AdminAPI = routesName.AdminRoute;
export const RecommendationAPI = routesName.RecommendationRoute;
export const HealthAPI = routesName.HealthRoute;
export const ElasticAPI = routesName.ElasticRoute;
export const TestAPI = routesName.TestRoute;
