import React, { useEffect, useMemo, useState } from "react";
import "../asserts/style/home.css";
import "../asserts/style/order.css";
import Navbar from "../comp/Navbar";
import Footer from "../comp/Footer";
import { useAuth } from "../Authentication/Authpro";

export default function Order() {
  const { currentUser, userData } = useAuth();
  const role = userData?.role || "customer";
  const uid = currentUser?.uid;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpdateStatus = async (orderId) => {
    try {
      const res = await fetch(`https://tech-store-txuf.onrender.com/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" })
      });
      if (!res.ok) throw new Error("Failed to update order");
      await fetchOrders();
    } catch (error) {
      alert("Unable to update the order right now.");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://tech-store-txuf.onrender.com/api/orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visibleOrders = useMemo(() => {
    if (role === "admin") return orders;
    if (role === "seller" && uid) {
      return orders.filter((order) => Array.isArray(order.menuItems) && order.menuItems.some((item) => item.sellerId === uid));
    }
    return [];
  }, [orders, role, uid]);

  return (
    <div className="orders-page admin-page">
      <Navbar />
      <main className="section">
        <div className="layout-container stack-lg">
          <header className="page-header">
            <div>
              <span className="page-kicker">Orders</span>
              <h1>Live order board</h1>
              <p className="text-muted">Track incoming orders and close them once fulfilled.</p>
            </div>
          </header>

          <section className="surface surface--inset stack-md">
            {loading ? (
              <div className="home-catalog__state" role="status">
                <span className="home-catalog__spinner" aria-hidden="true" />
                <p>Loading orders...</p>
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="empty-state admin-empty">
                <h3>No active orders</h3>
                <p className="text-muted">New orders will appear here automatically.</p>
              </div>
            ) : (
              <ul className="orders-grid">
                {visibleOrders.map((order, index) => (
                  <li key={order.orderid || index} className="order-card">
                    <div className="order-card__header">
                      <h3 className="order-card__title">Table {order.Table || "-"}</h3>
                      <span className="badge">{order.customerName || "Guest"}</span>
                    </div>
                    <ul className="order-card__items">
                      {Array.isArray(order.menuItems) && order.menuItems.map((item) => (
                        <li key={item.productId || item.dish_Id}>
                          <span>{item.name || item.dish_Name}</span>
                          <span className="order-card__qty">× {item.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="order-card__footer">
                      <span className="order-card__total">₹{Number(order.totalCost || 0).toFixed(2)}</span>
                      <button className="btn-primary" type="button" onClick={() => handleUpdateStatus(order.orderid)}>
                        Mark as done
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
