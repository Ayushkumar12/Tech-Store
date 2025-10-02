import React, { useState, useEffect, useMemo } from "react";
import "../asserts/style/home.css";
import "../asserts/style/order.css";
import Navbar from "../comp/Navbar";
import Footer from "../comp/Footer";
// Backend API used for orders now; Firebase import for orders removed
import { useAuth } from "../Authentication/Authpro";



export default function Order() {
  const { currentUser, userData } = useAuth();
  const role = userData?.role || 'customer';
  const uid = currentUser?.uid;
  const [orders, setorders] = useState([]);

  const handleDeleteOrder = async (orderId) => {
    try {
      const res = await fetch(`https://tech-store-txuf.onrender.com//api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      });
      if (!res.ok) throw new Error('Failed to update order');
      alert(`Order ${orderId} marked as done`);
      // refresh
      fetchOrders();
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Error updating order:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("https://tech-store-txuf.onrender.com//api/orders");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setorders(arr);
    } catch (e) {
      console.error("Failed to load orders", e);
      setorders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visibleOrders = useMemo(() => {
    if (role === 'admin') return orders;
    if (role === 'seller' && uid) {
      return orders.filter((o) => Array.isArray(o.menuItems) && o.menuItems.some((i) => i.sellerId === uid));
    }
    return [];
  }, [orders, role, uid]);

  return (
    <div>
      <Navbar/>
      <section className="home collection n">
        <div className="orderstart">
          <h1>Orders</h1>
        </div>
        <ul className="menu order">
          {visibleOrders.map((order, index) => (
            <li key={order.orderid || index} className="food2">
              <h3>{order.Table}{index}</h3>
              <h3>{order.customerName}</h3>
              <ul className="list">
                {order.menuItems.map((item) => (
                  <li key={item.productId || item.dish_Id}>
                    <p>
                      {(item.name || item.dish_Name)} {item.quantity}
                    </p>
                  </li>
                ))}
              </ul>
              <p>Total: ${order.totalCost}</p>
              <button onClick={() => handleDeleteOrder(order.orderid)}>Done</button>
            </li>
          ))}
          {visibleOrders.length === 0 && <p>No orders to show.</p>}
        </ul>
      </section>
      <Footer/>
    </div>
  );
}
