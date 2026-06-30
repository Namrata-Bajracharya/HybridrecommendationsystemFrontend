import React, { useState, useEffect } from 'react';
import { privateAgent, publicAgent } from '../Requests/AuthRequests';
import { TestAPI, UserAPI } from '../routes/Routes';

export default function Test() {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const [usersData, setUsersData] = useState(null);
  const [error, setError] = useState(null);

  // CRUD State
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '', quantity: '' });
  const [editingItem, setEditingItem] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '', price: '', quantity: '' });
  const [crudLoading, setCrudLoading] = useState(false);
  const [crudError, setCrudError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch Health Check - using publicAgent
  const fetchHealthCheck = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await publicAgent.get(TestAPI().healthCheck);
      setHealthData(response.data);
    } catch (err) {
      setError(`Health Check Error: ${err.message}`);
      console.error('Health Check Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch All Users - using privateAgent
  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(TestAPI().getAllUsers);
      setUsersData(response.data);
    } catch (err) {
      setError(`Users Fetch Error: ${err.response?.data?.detail || err.message}`);
      console.error('Users Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Current User - using privateAgent
  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await privateAgent.get(UserAPI().getMe);
      setSuccessMessage('Current user data fetched successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(`Current User Error: ${err.response?.data?.detail || err.message}`);
      console.error('Current User Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ============ CRUD Operations ============

  // GET - Fetch all items
  const fetchAllItems = async () => {
    try {
      setCrudLoading(true);
      setCrudError(null);
      const response = await publicAgent.get(TestAPI().crud.getAllItems);
      setItems(response.data);
      setSuccessMessage('Items fetched successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCrudError(`Fetch Items Error: ${err.message}`);
      console.error('Fetch Items Error:', err);
    } finally {
      setCrudLoading(false);
    }
  };

  // POST - Create new item
  const createItem = async () => {
    if (!newItem.title || !newItem.description || !newItem.price || !newItem.quantity) {
      setCrudError('All fields are required');
      return;
    }

    try {
      setCrudLoading(true);
      setCrudError(null);
      const response = await publicAgent.post(TestAPI().crud.createItem, {
        title: newItem.title,
        description: newItem.description,
        price: parseFloat(newItem.price),
        quantity: parseInt(newItem.quantity),
      });
      setItems([...items, response.data]);
      setNewItem({ title: '', description: '', price: '', quantity: '' });
      setSuccessMessage('Item created successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCrudError(`Create Item Error: ${err.response?.data?.detail || err.message}`);
      console.error('Create Item Error:', err);
    } finally {
      setCrudLoading(false);
    }
  };

  // PUT - Update item
  const updateItem = async (itemId) => {
    try {
      setCrudLoading(true);
      setCrudError(null);
      const response = await publicAgent.put(TestAPI().crud.updateItem(itemId), editData);
      setItems(items.map((item) => (item.id === itemId ? response.data : item)));
      setEditingItem(null);
      setEditData({ title: '', description: '', price: '', quantity: '' });
      setSuccessMessage('Item updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCrudError(`Update Item Error: ${err.response?.data?.detail || err.message}`);
      console.error('Update Item Error:', err);
    } finally {
      setCrudLoading(false);
    }
  };

  // DELETE - Delete item
  const deleteItem = async (itemId) => {
    try {
      setCrudLoading(true);
      setCrudError(null);
      await publicAgent.delete(TestAPI().crud.deleteItem(itemId));
      setItems(items.filter((item) => item.id !== itemId));
      setSuccessMessage('Item deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setCrudError(`Delete Item Error: ${err.response?.data?.detail || err.message}`);
      console.error('Delete Item Error:', err);
    } finally {
      setCrudLoading(false);
    }
  };

  useEffect(() => {
    // Fetch items on component mount
    fetchAllItems();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Integration Test</h1>
          <p className="text-gray-600 mb-8">Demonstrating POST, GET, UPDATE, DELETE operations</p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">API Error:</p>
              <p>{error}</p>
            </div>
          )}

          {crudError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">CRUD Error:</p>
              <p>{crudError}</p>
            </div>
          )}

          {/* ============ Testing Endpoints Section ============ */}
          <div className="mb-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Testing Endpoints</h2>

            {/* Button Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={fetchHealthCheck}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Loading...' : 'Test Health Check'}
              </button>

              <button
                onClick={fetchAllUsers}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Loading...' : 'Fetch All Users'}
              </button>

              <button
                onClick={fetchCurrentUser}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Loading...' : 'Get Current User'}
              </button>
            </div>
          </div>

          {/* ============ CRUD Operations Section ============ */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">CRUD Operations Demo</h2>

            {/* Create Item Form */}
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-xl font-bold text-green-900 mb-4">POST - Create New Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button
                onClick={createItem}
                disabled={crudLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {crudLoading ? 'Creating...' : 'Create Item'}
              </button>
              <p className="mt-2 text-sm text-green-700">
                <span className="font-semibold">Endpoint:</span> POST {TestAPI().crud.createItem}
              </p>
            </div>

            {/* Items List */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-xl font-bold text-blue-900 mb-4">GET - All Items ({items.length})</h3>
              <button
                onClick={fetchAllItems}
                disabled={crudLoading}
                className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {crudLoading ? 'Refreshing...' : 'Refresh Items'}
              </button>

              {items.length === 0 ? (
                <p className="text-gray-600">No items yet. Create one using the form above.</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-white border border-blue-300 rounded-lg hover:shadow-md transition"
                    >
                      {editingItem === item.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editData.title}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Title"
                          />
                          <input
                            type="text"
                            value={editData.description}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Description"
                          />
                          <input
                            type="number"
                            value={editData.price}
                            onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Price"
                          />
                          <input
                            type="number"
                            value={editData.quantity}
                            onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Quantity"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateItem(item.id)}
                              disabled={crudLoading}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:bg-gray-400 transition"
                            >
                              {crudLoading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                [{item.id}] {item.title}
                              </h4>
                              <p className="text-gray-600">{item.description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                            <p>
                              <span className="font-semibold text-gray-700">Price:</span> ${item.price}
                            </p>
                            <p>
                              <span className="font-semibold text-gray-700">Qty:</span> {item.quantity}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(item.id);
                                setEditData({
                                  title: item.title,
                                  description: item.description,
                                  price: item.price,
                                  quantity: item.quantity,
                                });
                              }}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteItem(item.id)}
                              disabled={crudLoading}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                            >
                              {crudLoading ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-sm text-blue-700">
                <span className="font-semibold">Endpoint:</span> GET {TestAPI().crud.getAllItems}
              </p>
            </div>
          </div>

          {/* ============ Responses Display ============ */}
          {healthData && (
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-xl font-bold text-blue-900 mb-4">Health Check Response</h2>
              <pre className="bg-white p-4 rounded border border-blue-300 text-sm text-gray-700 overflow-auto">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </div>
          )}

          {usersData && (
            <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-xl font-bold text-green-900 mb-4">
                All Users Response ({Array.isArray(usersData) ? usersData.length : 0} users)
              </h2>
              <pre className="bg-white p-4 rounded border border-green-300 text-sm text-gray-700 overflow-auto max-h-96">
                {JSON.stringify(usersData, null, 2)}
              </pre>
            </div>
          )}

          {/* ============ API Information ============ */}
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">API Configuration</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-600">
                  <span className="font-semibold">Base API URL:</span>
                </p>
                <p className="text-gray-900 break-all">http://localhost:8000/api/v1</p>
              </div>
              <div className="mt-4">
                <p className="font-semibold text-gray-900 mb-2">Available CRUD Endpoints:</p>
                <ul className="space-y-2 text-gray-700">
                  <li>
                    <span className="font-semibold text-green-600">POST</span> - Create Item:{' '}
                    {TestAPI().crud.createItem}
                  </li>
                  <li>
                    <span className="font-semibold text-blue-600">GET</span> - Get All Items:{' '}
                    {TestAPI().crud.getAllItems}
                  </li>
                  <li>
                    <span className="font-semibold text-yellow-600">PUT</span> - Update Item:{' '}
                    {TestAPI().crud.updateItem('id')}
                  </li>
                  <li>
                    <span className="font-semibold text-red-600">DELETE</span> - Delete Item:{' '}
                    {TestAPI().crud.deleteItem('id')}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
