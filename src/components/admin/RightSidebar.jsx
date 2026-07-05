import { useState, useEffect } from 'react'
import CategoryForm from './CategoryForm'
import ReviewsAdmin from './ReviewsAdmin'
import ProductForm from './ProductForm'
import { privateAgent } from '../../Requests/AuthRequests'
import { AdminAPI } from '../../routes/Routes'

function UsersCard(){
  const [count, setCount] = useState(0)
  useEffect(() => {
    privateAgent.get(AdminAPI({}).getDashboard)
      .then(({ data }) => setCount(data?.users?.total_customers ?? 0))
      .catch(() => {})
  }, [])
  return (
    <div className="bg-white rounded-2xl p-4 text-center">
      <p className="text-xs text-muted">Total customers</p>
      <p className="text-2xl font-semibold text-dark">{count}</p>
    </div>
  )
}

export default function RightSidebar({ onProductAdded }){
  return (
    <aside className="w-full lg:w-96 space-y-4">
      <UsersCard />
      <CategoryForm onAdded={()=>{ /* noop */ }} />
      <div className="bg-white rounded-2xl p-4">
        <p className="text-sm font-medium mb-2">Add Product (quick)</p>
        <ProductForm onDone={onProductAdded} />
      </div>
      <ReviewsAdmin />
    </aside>
  )
}
