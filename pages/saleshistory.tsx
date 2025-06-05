import React, { useEffect, useState } from "react";
import Header from "../layouts/header";
import Sidemenu from "../layouts/sidemenu";
import Breadcrumb from "../components/breadcrums";

interface SaleItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface SaleRecord {
  date: string;
  time: string;
  items: SaleItem[];
  subtotal: number;
  paidAmount?: number;
  change?: number;
}

function SalesHistory() {
  const [history, setHistory] = useState<SaleRecord[]>([]);

  useEffect(() => {
    const salesHistory = JSON.parse(localStorage.getItem("salesHistory") || "[]");
    // Reverse the array so newest is first
    setHistory(salesHistory.reverse());
  }, []);

  return (
    <>
      <Header />
      <Sidemenu />
      <div className="main-content app-content">
        <div className="container-fluid">
          <Breadcrumb title="Sales History" />
          <h2 className="mb-4">Sales History</h2>
          {history.length === 0 ? (
            <p>No sales have been made yet.</p>
          ) : (
            <div className="space-y-8">
              {history.map((sale, idx) => (
                <div key={idx} className="border rounded p-4 shadow">
                  <div className="flex justify-between mb-2">
                    <div>
                      <strong>Date:</strong> {sale.date}
                    </div>
                    <div>
                      <strong>Time:</strong> {sale.time}
                    </div>
                  </div>
                  <table className="table-auto w-full mb-2">
                    <thead>
                      <tr>
                        <th className="py-1">Product</th>
                        <th className="py-1">Quantity</th>
                        <th className="py-1">Price</th>
                        <th className="py-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item, itemIdx) => (
                        <tr key={itemIdx}>
                          <td className="py-1">{item.name}</td>
                          <td className="py-1 text-center">{item.quantity}</td>
                          <td className="py-1 text-center">₱{item.price.toFixed(2)}</td>
                          <td className="py-1 text-center">₱{item.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex flex-col items-end gap-1">
                    <strong>Subtotal: ₱{sale.subtotal.toFixed(2)}</strong>
                    {typeof sale.paidAmount === "number" && (
                      <span>Paid Amount: ₱{sale.paidAmount.toFixed(2)}</span>
                    )}
                    {typeof sale.change === "number" && (
                      <span>Change: ₱{sale.change.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SalesHistory;