import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

type OrderItem = { id: number; product: number; product_name: string; price: number; quantity: number };
type Order = { id: number; created_at: string; total: number; items: OrderItem[] };

export default function Orders() {
    const nav = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true); setErr(null);
            try {
                const res = await api.get<Order[]>("/orders/");
                setOrders(res.data);
            } catch (e: any) {
                if (e?.response?.status === 401) { nav("/login"); return; }
                setErr("Failed to load orders");
            } finally { setLoading(false); }
        })();
    }, [nav]);

    return (
        <div className="container">
            <div className="card" style={{ marginBottom: 16 }}>
                <h1 style={{ marginTop: 0 }}>Your Orders</h1>
                <p className="text-muted">Recent purchases and totals.</p>
            </div>

            {loading && <div className="card">Loading…</div>}
            {err && <div className="card text-danger">{err}</div>}

            {!loading && !err && orders.length === 0 && (
                <div className="card">No orders yet. <Link className="btn btn-primary mt-3" to="/products">Shop now</Link></div>
            )}

            {!loading && !err && orders.map(o => (
                <div key={o.id} className="card" style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div><b>Order #{o.id}</b></div>
                            <div className="text-muted">{new Date(o.created_at).toLocaleString()}</div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 18 }}>₹{Number(o.total).toFixed(2)}
                        </div>
                    </div>

                    <div style={{ marginTop: 12, borderTop: "1px solid #1c1f26", paddingTop: 12 }}>
                        {o.items.slice(0, 3).map(it => (
                            <div key={it.id} className="text-muted">
                                {it.product_name} × {it.quantity}
                            </div>
                        ))}
                        {o.items.length > 3 && <div className="text-muted">+{o.items.length - 3} more…</div>}
                    </div>

                    <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                        <Link className="btn btn-ghost" to={`/orders/${o.id}`}>View details</Link>
                    </div>
                </div>
            ))}
        </div>
    );
}
