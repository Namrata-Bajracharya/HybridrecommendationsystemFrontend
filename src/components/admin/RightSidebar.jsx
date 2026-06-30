import CategoryForm from './CategoryForm'
import ReviewsAdmin from './ReviewsAdmin'
import ProductForm from './ProductForm'

function UsersCard(){
  const users = JSON.parse(localStorage.getItem('users')||'[]')
  return (
    <div className="bg-white rounded-2xl p-4 text-center">
      <p className="text-xs text-muted">Total users</p>
      <p className="text-2xl font-semibold text-dark">{users.length}</p>
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
