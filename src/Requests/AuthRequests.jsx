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
    // Get token from secure cookies (primary source)
    const accessToken = Cookies.get('token');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error.response.data.message);
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
        const refreshToken = Cookies.get('refreshToken');
        
        if (!refreshToken) return Promise.reject(error);

        try {
          const refreshUrl = `${baseURL}${routesName.UserRoute({}).refreshToken}`;
          const response = await axios.post(refreshUrl, { refreshToken: refreshToken });
          if (response.status === 200) {
            const token = response.data.result.jwtToken;
            const newRefreshToken = response.data.result.refreshToken;
            
            // Update cookies only (secure)
            Cookies.set("token", token, { sameSite: 'Strict' });
            Cookies.set("refreshToken", newRefreshToken, { sameSite: 'Strict' });

            axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
            return privateAgent(originalRequest);
          }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (refreshError) {
          console.error('Token Refresh Error:', refreshError);
        
          // Check if refresh token failed because user was deleted
          if (refreshError.response?.status === 410) {
            
            handleDeletedUserIfNeeded(refreshError);
            return Promise.reject(refreshError);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export { privateAgent, publicAgent };
