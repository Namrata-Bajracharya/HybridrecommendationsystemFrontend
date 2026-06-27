import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from "react-router-dom";
import customFetch from "../axios/custom";
import { nanoid } from "nanoid";
import { formatDate } from "../utils/formatDate";
import { routesName } from "../RoutesName/Routes";
import Cookies from "js-cookie";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  if (!Cookies.get("token")) {
    return null;
  }

  const response = await customFetch.get(routesName.OrderRoute({ id }).single);
  return response.data;
};

const SingleOrderHistory = () => {
  const [user] = useState(JSON.parse(localStorage.getItem("user") || "{}"));
  const navigate = useNavigate();
  const singleOrder = useLoaderData() as Order;

  useEffect(() => {
    if (!user?.id) {
      toast.error("Please login to view this page");
      navigate("/login");
    }
  }, [user, navigate]);

  return (
    <div className="max-w-screen-2xl mx-auto pt-20 px-5">
      <h1 className="text-3xl font-bold mb-8">Order Details</h1>
      <div className="bg-white border border-gray-200 p-5 overflow-x-auto">
        <h2 className="text-2xl font-semibold mb-4">
          Order ID: {singleOrder.id}
        </h2>
        <p className="mb-2">Date: {formatDate(singleOrder.order_date || singleOrder.orderDate)}</p>
        <p className="mb-2">Subtotal: ${ singleOrder.total_amount || singleOrder.subtotal || 0 }</p>
        <p className="mb-2">Shipping: $5</p>
        <p className="mb-2">Tax: ${ (singleOrder.total_amount || singleOrder.subtotal || 0) / 5 }</p>
        <p className="mb-2">
          Total: $
          {((singleOrder.total_amount || singleOrder.subtotal || 0) + 5 + (singleOrder.total_amount || singleOrder.subtotal || 0) / 5).toFixed(2)}
        </p>
        <p className="mb-2">Status: {singleOrder.status || singleOrder.orderStatus}</p>
        <h3 className="text-xl font-semibold mt-6 mb-4">Items</h3>
        <table className="singleOrder-table min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-3 px-4 border-b">Product Name</th>
              <th className="py-3 px-4 border-b">Quantity</th>
              <th className="py-3 px-4 border-b">Price</th>
            </tr>
          </thead>
          <tbody>
            {(singleOrder.order_items || singleOrder.products || []).map((product) => (
              <tr key={nanoid()}>
                <td className="py-3 px-4 border-b">{product?.title || product?.product_id}</td>
                <td className="py-3 px-4 border-b text-center">
                  {product?.quantity}
                </td>
                <td className="py-3 px-4 border-b text-right">
                  ${Number(product?.unit_price || product?.price || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SingleOrderHistory;
