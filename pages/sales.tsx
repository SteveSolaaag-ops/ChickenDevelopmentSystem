import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Breadcrumb from "../components/breadcrums";
import Header from "../layouts/header";
import Sidemenu from "../layouts/sidemenu";
import { saveSaleToBackend, fetchInventory, fetchProducts, updateInventory } from "../api"; // Make sure updateInventory exists in your api

type Product = {
  id: number;
  name: string;
  image: string;
  price: number | string;
  category: string;
};

type CartType = { [key: number]: { quantity: number } };

type LastSaleType = {
  paidAmount: number;
  change: number;
  cart: CartType;
  subtotal: number;
  date: string;
  time: string;
} | null;

function Sales() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState<CartType>({});
  const [selectedCategory, setSelectedCategory] = useState("All Products");
  const [showReceipt, setShowReceipt] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [customerCash, setCustomerCash] = useState<string>("");
  const [change, setChange] = useState<number>(0);
  const [cashError, setCashError] = useState<string>("");
  const [lastSale, setLastSale] = useState<LastSaleType>(null);
  const [error, setError] = useState<string | null>(null);

  // Defensive product getter for cart, inventory, and receipt
  // Handles both string/number IDs robustly
  const getProduct = (id: number | string) =>
    products.find((p) => Number(p.id) === Number(id));

  const reloadData = () => {
    fetchProducts()
      .then((result) => {
        setProducts(result.data || []);
      })
      .catch(() => setError("Failed to fetch products."));
    fetchInventory()
      .then((result) => {
        setInventory(result.data || []);
      })
      .catch(() => setError("Failed to fetch inventory."));
  };

  useEffect(() => {
    const authState = localStorage.getItem("isAuthenticated");
    if (authState === "true") {
      setIsAuthenticated(true);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    reloadData();
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // Helper: Get available quantity for a product from inventory
  const getProductAvailability = (productId: number | string) => {
    return inventory
      .filter(
        (inv) =>
          Number(inv.product_id) === Number(productId) &&
          inv.expiry_date >= today &&
          inv.quantity > 0
      )
      .reduce((sum, inv) => sum + Number(inv.quantity), 0);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  // Prevent adding to cart more than available in inventory
  const addToCart = (productId: number) => {
    const newQty = (cart[productId]?.quantity || 0) + 1;
    if (newQty > getProductAvailability(productId)) {
      alert("Not enough stock available!");
      return;
    }
    setCart((prevCart) => ({
      ...prevCart,
      [productId]: {
        quantity: newQty,
      },
    }));
  };

  const incrementQuantity = (productId: number) => {
    const newQty = (cart[productId]?.quantity || 0) + 1;
    if (newQty > getProductAvailability(productId)) {
      alert("Not enough stock available!");
      return;
    }
    setCart((prevCart) => ({
      ...prevCart,
      [productId]: {
        ...prevCart[productId],
        quantity: newQty,
      },
    }));
  };

  const decrementQuantity = (productId: number) => {
    setCart((prevCart) => {
      const updatedCart = { ...prevCart };
      if (updatedCart[productId]?.quantity > 1) {
        updatedCart[productId].quantity -= 1;
      } else {
        delete updatedCart[productId];
      }
      return updatedCart;
    });
  };

  // Always use Number() so .toFixed() will never throw
  const subtotal: number = Object.entries(cart).reduce((sum, [productId, details]) => {
    const product = getProduct(productId);
    const totalPrice = (details.quantity || 0) * (Number(product?.price) || 0);
    return sum + totalPrice;
  }, 0);

  useEffect(() => {
    const cash = parseFloat(customerCash);
    if (!isNaN(cash)) {
      setChange(cash - subtotal);
    } else {
      setChange(0);
    }
  }, [customerCash, subtotal]);

  const availableInventory = inventory.filter(
    (inv) => inv.expiry_date >= today && inv.quantity > 0
  );
  const filteredProducts: Product[] =
    selectedCategory === "All Products"
      ? products.filter((p) =>
          availableInventory.some((inv) => Number(inv.product_id) === Number(p.id))
        )
      : products.filter(
          (product) =>
            product.category === selectedCategory &&
            availableInventory.some((inv) => Number(inv.product_id) === Number(product.id))
        );

  // Deduct inventory batches in FIFO order per sale
  const deductInventory = async (cart: CartType) => {
    for (const [productId, details] of Object.entries(cart)) {
      let qtyToDeduct = details.quantity;
      let invBatches = inventory
        .filter(
          (inv) =>
            Number(inv.product_id) === Number(productId) &&
            inv.expiry_date >= today &&
            inv.quantity > 0
        )
        .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
      for (const batch of invBatches) {
        if (qtyToDeduct <= 0) break;
        const deduct = Math.min(qtyToDeduct, batch.quantity);
        // You should implement updateInventory API to deduct per batch
        // await updateInventory(batch.id, batch.quantity - deduct);
        // For demo, just simulate in memory:
        batch.quantity -= deduct;
        qtyToDeduct -= deduct;
      }
    }
  };

  const buyNow = async () => {
    const cash = parseFloat(customerCash);
    if (isNaN(cash) || cash < subtotal) {
      setCashError("Insufficient cash provided.");
      return;
    }
    // Check again before finalizing purchase
    for (const [productId, details] of Object.entries(cart)) {
      if (details.quantity > getProductAvailability(productId)) {
        setCashError("Not enough stock for one or more items!");
        return;
      }
    }
    setCashError("");

    const now = new Date();
    const sales_date = now.toISOString().slice(0, 10);
    const sales_time = now.toTimeString().slice(0, 8);

    // Build items array as required by backend
    const items = Object.entries(cart).map(([productId, details]) => {
      const product = getProduct(productId);
      return {
        product_id: Number(productId),
        quantity: details.quantity,
        price: Number(product?.price) || 0
      };
    });

    setLastSale({
      paidAmount: cash,
      change: cash - subtotal,
      cart: { ...cart },
      subtotal,
      date: sales_date,
      time: sales_time,
    });

    try {
      const result = await saveSaleToBackend({
        sales_date,
        sales_time,
        subtotal,
        items, // <-- include items array!
      });
      if (result.status) {
        // Deduct from inventory (simulate or use backend API)
        await deductInventory(cart);

        const saleRecord = {
          date: sales_date,
          time: sales_time,
          items: Object.entries(cart).map(([productId, details]) => {
            const product = getProduct(productId);
            return {
              name: product ? product.name : "Unknown Product",
              price: Number(product?.price) || 0,
              quantity: details.quantity,
              total: (Number(product?.price) || 0) * details.quantity,
            };
          }),
          subtotal,
          paidAmount: cash,
          change: cash - subtotal,
        };
        const history = JSON.parse(localStorage.getItem("salesHistory") || "[]");
        history.push(saleRecord);
        localStorage.setItem("salesHistory", JSON.stringify(history));

        setShowReceipt(true);
        setCart({});
        setCustomerCash("");
        setChange(0);
        reloadData(); // Reload inventory/products after sale
      } else {
        alert("Sale not saved: " + result.message);
      }
    } catch (error) {
      alert("Error saving sale: " + error);
    }
  };

  const cancelOrder = () => {
    alert("Order has been canceled.");
    setCart({});
    setCustomerCash("");
    setChange(0);
    setCashError("");
  };

  const printReceipt = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return null;
  }

  if ((!products || products.length === 0) && (!inventory || inventory.length === 0)) {
    return (
      <>
        <Header />
        <Sidemenu />
        <div className="main-content app-content">
          <div className="container-fluid">
            <Breadcrumb title="TRIPLE E" />
            <div className="p-4 text-center">
              <h2>Nothing found.</h2>
              <button onClick={reloadData} className="btn btn-secondary mt-4">Reload</button>
              <pre>Products: {JSON.stringify(products, null, 2)}</pre>
              <pre>Inventory: {JSON.stringify(inventory, null, 2)}</pre>
              <pre>Error: {error}</pre>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb title="TRIPLE E" />
          <button onClick={reloadData} className="btn btn-secondary mb-4">Reload Inventory & Products</button>
          <div className="grid grid-cols-12 gap-x-6">
            <div className="col-span-12 mb-4 flex items-center justify-between">
              <div>
                <label htmlFor="category-dropdown" className="font-medium mr-4">
                  Select Category:
                </label>
                <select
                  id="category-dropdown"
                  className="form-select mt-2 p-2 border rounded w-64"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="All Products">All Products</option>
                  {[...new Set(products.map(p => p.category))].map(category => (
                    <option value={category} key={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="box overflow-hidden main-content-card p-4 text-center"
                >
                  <img
                    src={
                      product.image
                        ? `/assets/images/products/${product.image}`
                        : "/assets/images/products/placeholder.jpg"
                    }
                    alt={product.name || "Unknown Product"}
                    className="w-full h-40 object-cover mb-4"
                    onError={e =>
                      (e.currentTarget.src = "/assets/images/products/placeholder.jpg")
                    }
                  />
                  <h3 className="text-lg font-medium">{product.name || "Unknown Product"}</h3>
                  <p className="text-primary font-bold">
                    ₱{Number(product.price || 0).toFixed(2)} / kg
                  </p>
                  <span className="block text-sm text-gray-500 mb-2">
                    Available: {getProductAvailability(product.id)}
                  </span>
                  <div className="flex items-center justify-center mt-4">
                    <button
                      className="btn btn-sm bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded shadow hover:bg-gray-300 mx-2"
                      onClick={() => decrementQuantity(product.id)}
                      disabled={!cart[product.id]?.quantity}
                    >
                      -
                    </button>
                    <span className="font-medium text-lg">{cart[product.id]?.quantity || 0}</span>
                    <button
                      className="btn btn-sm bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded shadow hover:bg-gray-300 mx-2"
                      onClick={() => incrementQuantity(product.id)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    className="btn btn-primary mt-4"
                    onClick={() => addToCart(product.id)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>

            <div className="col-span-12 mt-6">
              <h2 className="mb-4">Cart Summary</h2>
              <div className="border border-gray-300 rounded p-4 shadow-lg">
                {Object.keys(cart).length > 0 ? (
                  <>
                    <table className="table-auto w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Product</th>
                          <th className="py-2">Quantity</th>
                          <th className="py-2">Price</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(cart).map(([productId, details]) => {
                          const product = getProduct(productId);
                          const { quantity } = details;
                          const price = Number(product?.price) || 0;
                          const totalPrice = quantity * price;
                          return (
                            <tr key={productId} className="border-b">
                              <td className="py-2">{product ? product.name : "Unknown Product"}</td>
                              <td className="py-2 text-center">{quantity}</td>
                              <td className="py-2 text-center">₱{price.toFixed(2)}</td>
                              <td className="py-2 text-center">₱{totalPrice.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                      <h3 className="text-lg font-bold">
                        Subtotal: ₱{subtotal.toFixed(2)}
                      </h3>
                    </div>

                    <div className="flex items-center mt-4">
                      <label className="mr-2 font-medium">Customer Cash (₱):</label>
                      <input
                        type="number"
                        min="0"
                        className="form-input w-32 p-2 border rounded"
                        value={customerCash}
                        onChange={(e) => {
                          setCustomerCash(e.target.value);
                          setCashError("");
                        }}
                        placeholder="Enter amount"
                      />
                    </div>
                    {customerCash && (
                      <div className="flex items-center mt-2">
                        <span className="font-medium">Change:</span>
                        <span className={`ml-2 font-bold ${change < 0 ? "text-red-500" : "text-green-600"}`}>
                          ₱{change >= 0 ? change.toFixed(2) : "0.00"}
                        </span>
                      </div>
                    )}
                    {cashError && (
                      <div className="text-red-500 text-sm mt-2">{cashError}</div>
                    )}

                    <div className="flex justify-center space-x-4 mt-6">
                      <button
                        className="px-6 py-4 bg-green-500 text-white font-bold rounded shadow border border-green-700 hover:bg-green-600"
                        onClick={buyNow}
                      >
                        Buy
                      </button>
                      <button
                        className="px-6 py-4 bg-red-500 text-white font-bold rounded shadow border border-red-700 hover:bg-red-600"
                        onClick={cancelOrder}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center">No items in the cart.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Modal */}
        {showReceipt && lastSale && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white w-96 p-6 rounded shadow-lg">
              <h2 className="text-lg font-bold mb-4">Receipt</h2>
              <p>Date: {lastSale.date}</p>
              <p>Time: {lastSale.time}</p>
              <hr className="my-4" />
              <ul>
                {Object.entries(lastSale.cart).map(([productId, details]) => {
                  const product = getProduct(productId);
                  const { quantity } = details;
                  const price = Number(product?.price) || 0;
                  const totalPrice = quantity * price;
                  return (
                    <li key={productId} className="flex justify-between mb-2">
                      <span>
                        {product ? product.name : "Unknown Product"} x {quantity}
                      </span>
                      <span>₱{totalPrice.toFixed(2)}</span>
                    </li>
                  );
                })}
              </ul>
              <hr className="my-4" />
              <div className="flex justify-between font-bold">
                <span>Subtotal:</span>
                <span>₱{lastSale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span>₱{lastSale.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>₱{lastSale.change >= 0 ? lastSale.change.toFixed(2) : "0.00"}</span>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-blue-500 text-white font-bold rounded shadow"
                  onClick={printReceipt}
                >
                  Print
                </button>
                <button
                  className="px-4 py-2 bg-gray-300 font-bold rounded shadow"
                  onClick={() => { setShowReceipt(false); setLastSale(null); }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Sales;