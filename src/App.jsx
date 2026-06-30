/* ── App ──
   Root component. Wraps the entire app in context providers
   (Auth → Cart → Wishlist → Recommendations) and defines
   page routing via react-router-dom. Includes the global
   AuthModal and Navbar/Footer chrome. */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { RecommendationProvider } from './context/RecommendationContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import HomePage from './pages/Home'
import ProductsPage from './pages/Products'
import CollectionPage from './pages/Collection'
import ProductDetailPage from './pages/ProductDetail'
import CartPage from './pages/Cart'
import WishlistPage from './pages/Wishlist'
import OrdersPage from './pages/Orders'
import AdminPage from './pages/Admin'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import UserDashboard from './pages/UserDashboard'
import Test from './pages/Test'
import RecommendationDemo from './pages/RecommendationDemo'

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
              {/* ── Global chrome ── */}
              <Navbar />
              <AuthModal />

              {/* ── Page content ── */}
              <main className="mx-auto py-8 min-h-[60vh]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/:userid/dashboard" element={<UserDashboard />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/collection" element={<CollectionPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminPage />} />
                  <Route path="/test" element={<Test />} />
                  <Route path="/recommendations-demo" element={<RecommendationDemo />} />
                </Routes>
              </main>

              <Footer />
            </RecommendationProvider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
