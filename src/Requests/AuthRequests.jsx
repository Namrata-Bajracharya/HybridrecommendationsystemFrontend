import axios from 'axios';
import Cookies from 'js-cookie';
import { BASE_API_ROUTE, routesName } from '../routes/Routes';
import { handleDeletedUserIfNeeded } from '../utils/handleDeletedUser';


const baseURL = BASE_API_ROUTE;

const privateAgent = axios.create({
  baseURL,
});

const publicAgent = axios.create({
  baseURL,
});

privateAgent.interceptors.request.use(
  (config) => {
    // Get token from cookies or localStorage (support both during transition)
    const accessToken = Cookies.get('token') || localStorage.getItem('kalleenepal_token');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error?.response?.data || error.message || error);
    return Promise.reject(error);
  }
);

privateAgent.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('Response Error:', error);
    const originalRequest = error.config;
    
    // Check if user account has been deleted (HTTP 410 Gone)
    if (error.response?.status === 410) {
      
      if (handleDeletedUserIfNeeded(error)) {
        // User was deleted, cleanup is already handled
        return Promise.reject(error);
      }
    }
    
    // Check for deleted user error in 401 response
    if (error.response?.status === 401) {
      const errorMsg = error.response?.data?.data || error.response?.data?.message || "";
      
      // Check if this is a deleted user error
      if (errorMsg.toLowerCase().includes("deleted")) {
        
        if (handleDeletedUserIfNeeded(error)) {
          // User was deleted, cleanup is already handled
          return Promise.reject(error);
        }
      }
      
      // Normal 401 - try to refresh token
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = Cookies.get('refreshToken') || localStorage.getItem('kalleenepal_refresh_token');

        if (!refreshToken) return Promise.reject(error);

        try {
          const userRoutes = routesName.UserRoute({});
          const refreshUrl = userRoutes.refreshToken || `${baseURL}/users/refresh`;
          const response = await axios.post(refreshUrl, { refresh_token: refreshToken });
          if (response.status === 200) {
            const token = response.data.result?.jwtToken || response.data.token;
            const newRefreshToken = response.data.result?.refreshToken || response.data.refreshToken || response.data.refresh_token;

            if (token) {
              Cookies.set('token', token, { sameSite: 'Strict' });
              localStorage.setItem('kalleenepal_token', token);
            }
            if (newRefreshToken) {
              Cookies.set('refreshToken', newRefreshToken, { sameSite: 'Strict' });
              localStorage.setItem('kalleenepal_refresh_token', newRefreshToken);
            }

            // Retry with fresh config to avoid stale interceptor state
            return privateAgent({
              method: originalRequest.method,
              url: originalRequest.url,
              data: originalRequest.data,
              params: originalRequest.params,
              headers: {
                Authorization: 'Bearer ' + token,
              },
            });
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (refreshError) {
          console.error('Token Refresh Error:', refreshError?.response?.data || refreshError.message || refreshError);

          if (refreshError.response?.status === 410) {
            handleDeletedUserIfNeeded(refreshError);
            return Promise.reject(refreshError);
          }

          // Force logout on refresh failure (expired or invalid refresh token)
          Cookies.remove('token');
          Cookies.remove('refreshToken');
          localStorage.removeItem('kalleenepal_token');
          localStorage.removeItem('kalleenepal_refresh_token');
          localStorage.removeItem('kalleenepal_session');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export { privateAgent, publicAgent };
