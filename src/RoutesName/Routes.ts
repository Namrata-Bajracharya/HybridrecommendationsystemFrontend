interface ParamInterface {
  id?: number | string | string[];
  pageNum?: number;
  searchTerm?: string;
  RecordPerPage?: number;
  token?: string;
  type?: string;
  reminderOption?: {
    reminderId?: number;
    reminderType?: string;
    noteId?: number;
  };
}

const ENV = import.meta.env.VITE_ENV;

export const HOST_URL =
  ENV === "production"
    ? import.meta.env.VITE_API_URL || "https://fastapi.kallee.com"
    : import.meta.env.VITE_API_URL || "http://localhost:8000";

export const SOCKET_URL =
  ENV === "production"
    ? import.meta.env.VITE_SOCKET_URL || "https://kallee.com"
    : import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

export const SOCKET_PATH = "/socket.io";

const ROOT_ROUTE = "/api/v1";

export const BASE_API_ROUTE = HOST_URL + ROOT_ROUTE;

export const routesName = {
  HealthRoute() {
    return {
      check: `/healthcheck`,
      root: `/`,
      docs: `/docs`,
    };
  },

  AuthRoute() {
    return {
      login: `/users/login`,
      register: `/users/register`,
      me: `/users/me`,
      validateToken: `/users/me`,
    };
  },

  UserRoute({ id }: ParamInterface = {}) {
    return {
      profile: `/users/me`,
      updateProfile: `/users/me`,
      deleteProfile: `/users/me`,
      addAddress: `/users/me/address`,
      updateAddress: `/users/me/address/${id}`,
    };
  },

  ProductRoute({ id, pageNum, RecordPerPage, searchTerm }: ParamInterface = {}) {
    const page = pageNum ?? 1;
    const perPage = RecordPerPage ?? 10;
    const q = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";

    return {
      get: `/product?page=${page}&per_page=${perPage}${q}`,
      create: `/product`,
      update: `/product/${id}`,
      delete: `/product/${id}`,
      bySlug: `/product/${id}`,
      byId: `/product/id/${id}`,
      autocomplete: `/product/autocomplete`,
      byCategorySlug: `/product/category/${id}`,
    };
  },

  CategoryRoute({ id }: ParamInterface = {}) {
    return {
      get: `/category`,
      create: `/category`,
      update: `/category/${id}`,
      delete: `/category/${id}`,
      single: `/category/${id}`,
    };
  },

  CartRoute({ id }: ParamInterface = {}) {
    return {
      get: `/cart`,
      create: `/cart`,
      clear: `/cart`,
      updateItem: `/cart/items/${id}`,
      removeItem: `/cart/items/${id}`,
    };
  },

  OrderRoute({ id }: ParamInterface = {}) {
    return {
      get: `/order`,
      create: `/order`,
      single: `/order/${id}`,
    };
  },

  ReviewRoute({ id }: ParamInterface = {}) {
    return {
      get: `/reviews`,
      create: `/reviews`,
      update: `/reviews/${id}`,
      delete: `/reviews/${id}`,
    };
  },

  PaymentRoute({ id }: ParamInterface = {}) {
    return {
      get: `/payments`,
      create: `/payments`,
      single: `/payments/${id}`,
      verify: `/payments/verify/${id}`,
    };
  },

  WishlistRoute({ id }: ParamInterface = {}) {
    return {
      get: `/wishlist`,
      create: `/wishlist`,
      remove: `/wishlist/${id}`,
    };
  },

  ElasticRoute() {
    return {
      search: `/elastic/search`,
      suggest: `/elastic/suggest`,
    };
  },

  AdminRoute() {
    return {
      dashboard: `/admin/dashboard`,
      users: `/admin/users`,
      orders: `/admin/orders`,
      sales: `/admin/analytics/sales`,
      userAnalytics: `/admin/analytics/users`,
      productAnalytics: `/admin/analytics/products`,
      reviewAnalytics: `/admin/analytics/reviews`,
    };
  },
};
