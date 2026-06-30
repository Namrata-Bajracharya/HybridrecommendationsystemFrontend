/**
 * Handle deleted user scenarios
 * Cleans up authentication state when user is deleted
 */

export const handleDeletedUserIfNeeded = (error) => {
  // Check if this is a deleted user error
  const errorMsg = error.response?.data?.data || error.response?.data?.message || "";
  
  if (errorMsg.toLowerCase().includes("deleted") || error.response?.status === 410) {
    // Clear authentication data
    clearAuthData();
    
    // Show notification to user (optional)
    console.warn("Your account has been deleted. Please log in with a different account.");
    
    // Redirect to home or login page
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    
    return true; // User was deleted
  }
  
  return false; // User was not deleted
};

/**
 * Clear all authentication-related data
 */
export const clearAuthData = () => {
  try {
    // Clear cookies
    if (typeof document !== "undefined") {
      const Cookies = require("js-cookie").default;
      Cookies.remove("token");
      Cookies.remove("refreshToken");
    }
    
    // Clear localStorage
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
    
    // Clear sessionStorage
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
    }
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};
