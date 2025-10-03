import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../comp/Navbar";
import Footer from "../comp/Footer";
import "../asserts/style/home.css";

// Basic cart page using backend cart API
function Cart() {
  // Simple cartId strategy: single shared cart for now
  const cartId = useMemo(() => "default", []);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [table, setTable] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateQty = async (productId, quantity) => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}/items/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity })
      });
      await load();
    } catch (e) { console.error(e); }
  };

  const removeItem = async (productId) => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}/items/${productId}`, { method: "DELETE" });
      await load();
    } catch (e) { console.error(e); }
  };

  const clearCart = async () => {
    try {
      await fetch(`https://tech-store-txuf.onrender.com/api/cart/${cartId}`, { method: "DELETE" });
      await load();
    } catch (e) { console.error(e); }
  };

  const placeOrder = async () => {
    if (!customerName || !table) { alert("Enter name and table"); return; }
    try {
      const res = await fetch("https://tech-store-txuf.onrender.com/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartId, customerName, table, restaurantId: "12345" })
      });
      if (!res.ok) throw new Error("Failed to place order");
      alert("Order placed");
      setCustomerName("");
      setTable("");
      await load();
    } catch (e) {
      console.error(e);
      alert("Order failed");
    }
  };

  return (
    <section>
      <Navbar />
      <main>
        <section className="collection">
          <h2>Your Cart</h2>
          {loading ? (
            <p>Loading...</p>
          ) : items.length === 0 ? (
            <p>Cart is empty.</p>
          ) : (
            <div className="cart-wrap" style={{ width: '100%' }}>
              <table className="cart">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.productId}>
                      <td>{it.name}</td>
                      <td>${Number(it.price || 0).toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          min={0}
                          value={it.quantity}
                          onChange={(e) => updateQty(it.productId, Number(e.target.value) || 0)}
                          style={{ width: 60 }}
                        />
                      </td>
                      <td>${(Number(it.price || 0) * Number(it.quantity || 0)).toFixed(2)}</td>
                      <td>
                        <button className="sub" onClick={() => removeItem(it.productId)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right' }}>Total:</td>
                    <td colSpan={2}>${Number(total || 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>

              <div className="cont">
                <form onSubmit={(e) => { e.preventDefault(); placeOrder(); }}>
                  <h3>Customer Name:</h3>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name" />
                  <h3>Table:</h3>
                  <input type="text" value={table} onChange={(e) => setTable(e.target.value)} placeholder="T4675" />
                </form>
                <div className="obut">
                  <button className="sub" onClick={clearCart}>Reset</button>
                  <button className="sub" onClick={placeOrder}>Place Order</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </section>
  );
}

export default Cart;