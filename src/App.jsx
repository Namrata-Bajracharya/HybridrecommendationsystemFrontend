/* ── App ──
   Root component. Wraps the entire app in context providers
   (Auth → Cart → Wishlist → Recommendations) and defines
   page routing via react-router-dom. Includes the global
   AuthModal and Navbar/Footer chrome. */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
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

function GuestRoute({ children }) {
  const { user } = useAuth()
  if (user) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : `/${user.id}/dashboard`} replace />
  return children
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
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
              {/* ── Global chrome ── */}
              <Navbar />
              <AuthModal />

              {/* ── Page content ── */}
              <main className="mx-auto py-8 min-h-[60vh]">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/collection" element={<CollectionPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                  <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                  <Route path="/:userid/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                  <Route path="/admin" element={<AdminRoute><Navigate to="/admin/dashboard" replace /></AdminRoute>} />
                  <Route path="/admin/dashboard" element={<AdminRoute><AdminPage /></AdminRoute>} />
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
