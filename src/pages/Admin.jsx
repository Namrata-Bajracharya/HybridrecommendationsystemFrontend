/* AdminPage
   Clean dashboard shell. Auth-gated, tab-based navigation
   with lazy-loaded tab components. */
import { useState } from 'react'
import { useAdminAuth } from '../hooks/useAdminAuth'
import AdminAuth from '../components/admin/AdminAuth'
import NotificationBell from '../components/admin/NotificationBell'
import DashboardTab from '../components/admin/DashboardTab'
import ProductsTab from '../components/admin/ProductsTab'
import OrdersTab from '../components/admin/OrdersTab'
import DiscountsTab from '../components/admin/DiscountsTab'
import InventoryTab from '../components/admin/InventoryTab'
import CategoriesTab from '../components/admin/CategoriesTab'
import CustomersTab from '../components/admin/CustomersTab'
import ReportsTab from '../components/admin/ReportsTab'

const TABS = ['dashboard', 'products', 'orders', 'discounts', 'inventory', 'categories', 'customers', 'reports']

export default function AdminPage() {
  const { admin, signin, signup, signout } = useAdminAuth()
  const [tab, setTab] = useState('dashboard')

  const handleAuth = (mode, name, email, password, setError) => {
    const err = mode === 'signin' ? signin(email, password) : signup(name, email, password)
    if (err) setError(err)
  }

  if (!admin) return <AdminAuth onLogin={handleAuth} />

  const tabComponents = { dashboard: DashboardTab, products: ProductsTab, orders: OrdersTab, discounts: DiscountsTab, inventory: InventoryTab, categories: CategoriesTab, customers: CustomersTab, reports: ReportsTab }
  const TabComponent = tabComponents[tab]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-dark">Admin Panel</h1>
        <div className="flex items-center gap-4 text-sm">
          <NotificationBell />
          <span className="text-muted">{admin.name}</span>
          <button className="text-xs text-accent hover:underline" onClick={signout}>Sign Out</button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-cream-alt mb-8 overflow-x-auto">
        {TABS.map(k => (
          <button key={k} className={`pb-2 text-sm capitalize transition border-b-2 shrink-0 ${tab === k ? 'text-dark border-dark font-medium' : 'text-muted border-transparent hover:text-dark'}`}
            onClick={() => setTab(k)}>{k}</button>
        ))}
      </div>

      <TabComponent />
    </div>
  )
}
