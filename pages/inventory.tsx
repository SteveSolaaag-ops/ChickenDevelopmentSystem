import React, { useEffect, useState } from "react";
import { fetchInventory, addInventoryToBackend, fetchProducts, addProductToBackend } from "../api";
import Header from "../layouts/header";
import Sidemenu from "../layouts/sidemenu";
import Breadcrumb from "../components/breadcrums";

export default function Inventory() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    quantity: "",
    date_received: "",
    expiry_date: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch products and inventory on mount
  useEffect(() => {
    fetchProducts().then((data) => setProducts(data.data || []));
    fetchInventory().then((data) => setInventory(data.data || []));
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // On submit, add product if not exists, then add inventory
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Basic validation
    if (!form.name || !form.price || !form.category || !form.quantity || !form.date_received || !form.expiry_date) {
      setError("All fields except image are required.");
      return;
    }

    // Try to find product by name (case-insensitive)
    let product = products.find(
      (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
    );
    let product_id;

    // If not found, add product first
    if (!product) {
      const prodResult = await addProductToBackend({
        name: form.name,
        price: Number(form.price),
        category: form.category,
        image: form.image || "placeholder.jpg",
      });

      if (prodResult && prodResult.status) {
        // Refetch products to get new ID
        const newProducts = await fetchProducts();
        setProducts(newProducts.data || []);
        product = (newProducts.data || []).find(
          (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );
        product_id = product?.id;
      } else if (prodResult && prodResult.message?.includes("already exists")) {
        // Product already exists, fetch products to get ID
        const newProducts = await fetchProducts();
        setProducts(newProducts.data || []);
        product = (newProducts.data || []).find(
          (p) => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
        );
        product_id = product?.id;
      } else {
        setError(prodResult?.message || "Failed to add product.");
        return;
      }
    } else {
      product_id = product.id;
    }

    if (!product_id) {
      setError("Product ID not found after creation.");
      return;
    }

    // Now add inventory for this product
    const invPayload = {
      product_id: Number(product_id),
      quantity: Number(form.quantity),
      date_received: form.date_received,
      expiry_date: form.expiry_date,
    };
    const invResult = await addInventoryToBackend(invPayload);

    if (invResult && (invResult.status || invResult.success)) {
      fetchInventory().then((data) => setInventory(data.data || []));
      setMessage("Inventory added successfully.");
      setForm({
        name: "",
        price: "",
        category: "",
        image: "",
        quantity: "",
        date_received: "",
        expiry_date: "",
      });
      setError(null);
    } else {
      setError(invResult?.message || "Failed to add inventory.");
    }
  };

  // Helper to get product image by ID
  const getProductImage = (id: number) =>
    products.find((p) => p.id === id)?.image || "";

  // Helper to get product name by ID
  const getProductName = (id: number) =>
    products.find((p) => p.id === id)?.name || "Unknown";

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb title="Inventory" />
          <div className="border rounded shadow p-6 bg-white max-w-4xl mb-8">
            <h2 className="mb-4 font-bold text-lg">Add Inventory</h2>
            <form className="flex flex-wrap gap-2 items-end" onSubmit={handleAdd}>
              <div>
                <label>Product Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g. Chicken Liver"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Price (₱)</label>
                <input
                  name="price"
                  type="number"
                  placeholder="Price"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Category</label>
                <input
                  name="category"
                  type="text"
                  placeholder="e.g. Offal"
                  value={form.category}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Image (filename)</label>
                <input
                  name="image"
                  type="text"
                  placeholder="e.g. chicken_liver.jpg"
                  value={form.image}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label>Quantity</label>
                <input
                  name="quantity"
                  type="number"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Date Received</label>
                <input
                  name="date_received"
                  type="date"
                  value={form.date_received}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Expiry Date</label>
                <input
                  name="expiry_date"
                  type="date"
                  value={form.expiry_date}
                  onChange={handleChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="rounded px-6 py-3 font-bold shadow transition text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-700 text-lg"
                style={{
                  boxShadow: "0 4px 16px 0 rgba(30, 64, 175, 0.10)",
                  marginTop: 12
                }}
              >
                Add Inventory
              </button>
              {(error || message) && (
                <div className="ml-4 text-sm" style={{ color: error ? "red" : "green" }}>
                  {error || message}
                </div>
              )}
            </form>
          </div>

          <h2 className="mb-4">Current Inventory</h2>
          <table className="table-auto w-full border">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Date Received</th>
                <th>Expiry Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <img
                      src={`/assets/images/products/${getProductImage(inv.product_id)}`}
                      alt=""
                      style={{ maxWidth: "60px" }}
                    />
                  </td>
                  <td>{getProductName(inv.product_id)}</td>
                  <td>{inv.quantity}</td>
                  <td>{inv.date_received}</td>
                  <td>{inv.expiry_date}</td>
                  <td style={{ color: inv.expiry_date < today ? "red" : "green" }}>
                    {inv.expiry_date < today ? "Expired" : "OK"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}