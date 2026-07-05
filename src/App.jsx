/* ── App ──
   Root component. Wraps the entire app in context providers
   (Auth → Cart → Wishlist → Recommendations) and defines
   page routing via react-router-dom. Includes the global
   AuthModal and Navbar/Footer chrome. */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { RecommendationProvider } from "./context/RecommendationContext";
import { SocketProvider } from "./context/SocketContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SocketNotifier from "./components/SocketNotifier";

import HomePage from "./pages/Home";
import ProductsPage from "./pages/Products";
import CollectionPage from "./pages/Collection";
import ProductDetailPage from "./pages/ProductDetail";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import AdminPage from "./pages/Admin";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import UserDashboard from "./pages/UserDashboard";
import OrderDetailPage from "./pages/OrderDetail";
import Test from "./pages/Test";
import RecommendationDemo from "./pages/RecommendationDemo";
import TestRecommendation from "./pages/TestRecommendation";
import VerifyEmail from "./pages/VerifyEmail";
import ProfileComplete from "./pages/ProfileComplete";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";

function GuestRoute({ children }) {
  const { user } = useAuth();
  if (user)
    return (
      <Navigate
        to={
          user.role === "admin" ? "/admin/dashboard" : `/${user.id}/dashboard`
        }
        replace
      />
    );
  return children;
}

function ProtectedRoute({ children, requireProfile = true }) {
  const { user, isProfileComplete } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireProfile && !isProfileComplete) return <Navigate to="/profile/complete" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : `/${user.id}/dashboard`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ── ProvideRs nested so each context can depend on parents:
           Auth → Cart (no auth dep) → Wishlist (depends on Auth)
           → Recommendations (depends on Auth + Cart) ── */}
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <RecommendationProvider>
              <SocketProvider>
              <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: "top", horizontal: "right" }}>
              {/* ── Global chrome ── */}
              <Navbar />

              {/* ── Page content ── */}
              <SocketNotifier />
              <main className="mx-auto py-8 min-h-[60vh]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <LoginPage />
                      </GuestRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <GuestRoute>
                        <RegisterPage />
                      </GuestRoute>
                    }
                  />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/collections" element={<CollectionPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/checkout"
                    element={
                      <CustomerRoute>
                        <CheckoutPage />
                      </CustomerRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={<DashboardRedirect />}
                  />
                  <Route
                    path="/wishlist"
                    element={<DashboardRedirect />}
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <Navigate to="/admin/dashboard" replace />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/customers/:customerId"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/:tab"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/:userid/dashboard"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/:userid/dashboard/:tab"
                    element={
                      <ProtectedRoute>
                        <UserDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/test" element={<Test />} />
                  <Route
                    path="/recommendations-demo"
                    element={<RecommendationDemo />}
                  />
                  <Route
                    path="/testrecommendation"
                    element={<TestRecommendation />}
                  />
                  <Route path="/verify" element={<VerifyEmail />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/change-password"
                    element={
                      <ProtectedRoute requireProfile={false}>
                        <ChangePassword />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/complete"
                    element={
                      <ProtectedRoute requireProfile={false}>
                        <ProfileComplete />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetailPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile/edit"
                    element={
                      <ProtectedRoute>
                        <ProfileComplete />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>

              <Footer />
            </SnackbarProvider>
            </SocketProvider>
            </RecommendationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
