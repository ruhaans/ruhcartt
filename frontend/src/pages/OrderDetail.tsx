import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate, useParams } from "react-router-dom";

type OrderItem = { id: number; product: number; product_name: string; price: number; quantity: number };
type Order = { id: number; created_at: string; shipping_address: string; total: number; items: OrderItem[] };

export default function OrderDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true); setErr(null);
            try {
                const res = await api.get<Order>(`/orders/${id}/`);
                setOrder(res.data);
            } catch (e: any) {
                if (e?.response?.status === 401) { nav("/login"); return; }
                setErr("Order not found");
            } finally { setLoading(false); }
        })();
    }, [id, nav]);

    return (
        <div className="container">
            {loading && <div className="card">Loading…</div>}
            {err && <div className="card text-danger">{err}</div>}
            {!loading && !err && order && (
                <div className="card">
                    <h1 style={{ marginTop: 0 }}>Order #{order.id}</h1>
                    <div className="text-muted">{new Date(order.created_at).toLocaleString()}</div>

                    <div style={{ marginTop: 16 }}>
                        {order.items.map(it => (
                            <div key={it.id} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "8px 0", borderBottom: "1px solid #1c1f26" }}>
                                <div>{it.product_name}</div>
                                <div className="text-muted">x{it.quantity}</div>
                                <div style={{ fontWeight: 700 }}>₹{(it.price * it.quantity).toFixed(2)}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                        <span>Shipping</span>
                        <span className="text-muted">{order.shipping_address || "—"}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                        <span>Total</span><span>₹{Number(order.total).toFixed(2)}
                        </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                        <Link className="btn btn-ghost" to="/orders">Back to Orders</Link>
                        <Link className="btn btn-primary" to="/products">Shop more</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
