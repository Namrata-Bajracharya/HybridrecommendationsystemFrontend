/* AdminPage
   Clean dashboard shell. Auth-gated, tab-based navigation
   with lazy-loaded tab components. */
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import NotificationBell from '../components/admin/NotificationBell'
import DashboardTab from '../components/admin/DashboardTab'
import ProductsTab from '../components/admin/ProductsTab'
import OrdersTab from '../components/admin/OrdersTab'
import DiscountsTab from '../components/admin/DiscountsTab'
import InventoryTab from '../components/admin/InventoryTab'
import CategoriesTab from '../components/admin/CategoriesTab'
import CustomersTab from '../components/admin/CustomersTab'
import ReportsTab from '../components/admin/ReportsTab'
import RightSidebar from '../components/admin/RightSidebar'

const TABS = ['dashboard', 'categories', 'products', 'orders', 'discounts', 'inventory', 'customers', 'reports']

export default function AdminPage() {
  const { user, signout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  useEffect(() => {
    // if not signed in redirect to global login
    if (!user) {
      navigate('/login')
      return
    }
    // if signed in but not admin redirect to user dashboard
    if (user.role && user.role !== 'admin') {
      navigate(`/${user.id}/dashboard`)
    }
  }, [user])

  const tabComponents = { dashboard: DashboardTab, categories: CategoriesTab, products: ProductsTab, orders: OrdersTab, discounts: DiscountsTab, inventory: InventoryTab, customers: CustomersTab, reports: ReportsTab }
  const TabComponent = tabComponents[tab]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      <div className="flex gap-6 border-b border-cream-alt mb-8 overflow-x-auto">
        {TABS.map(k => (
          <button key={k} className={`pb-2 text-sm capitalize transition border-b-2 shrink-0 ${tab === k ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}
            onClick={() => setTab(k)}>{k}</button>
        ))}
      </div>

      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="flex-1">
          <TabComponent />
        </div>
        <RightSidebar onProductAdded={() => { /* refresh UI if needed */ }} />
      </div>
    </div>
  )
}
