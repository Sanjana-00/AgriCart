
import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Package,
  AlertTriangle,
  RefreshCw,
  Sprout,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line
} from "recharts";
import "./FarmerAnalytics.css";

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  })}`;

export default function FarmerAnalytics({ user }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    if (!user?.name) {
      setError("Please sign in with your farmer account.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/farmer-analytics?farmer=${encodeURIComponent(user.name)}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to load analytics.");
      }

      setData(result);
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, [user?.name]);

  if (loading) {
    return (
      <section className="farmer-analytics">
        <div className="fa-message">
          <RefreshCw className="fa-spin" size={24} />
          <p>Loading your farm analytics...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="farmer-analytics">
        <div className="fa-message fa-error">
          <AlertTriangle size={25} />
          <p>{error}</p>
          <button onClick={loadAnalytics}>Try again</button>
        </div>
      </section>
    );
  }

  const summary = data.summary;
  const inventory = data.inventory;

  const stats = [
    {
      label: "Delivered revenue",
      value: money(summary.deliveredRevenue),
      note: "From delivered orders",
      icon: IndianRupee,
      color: "green"
    },
    {
      label: "Total orders",
      value: summary.totalOrders,
      note: `${summary.deliveredOrders} delivered`,
      icon: ShoppingBag,
      color: "blue"
    },
    {
      label: "Products listed",
      value: inventory.totalProducts,
      note: `${inventory.availableProducts} currently in stock`,
      icon: Package,
      color: "purple"
    },
    {
      label: "Units sold",
      value: summary.totalUnitsSold,
      note: "From delivered orders",
      icon: TrendingUp,
      color: "orange"
    }
  ];

  return (
    <section className="farmer-analytics">
      <header className="fa-header">
        <div>
          <span className="fa-eyebrow">
            <Sprout size={15} /> FARMER WORKSPACE
          </span>
          <h1>Farm Analytics</h1>
          <p>
            Welcome back, {user?.name}. Here's how your farm is performing.
          </p>
        </div>

        <button
          className="fa-refresh"
          onClick={loadAnalytics}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </header>

      <div className="fa-stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="fa-stat-card" key={stat.label}>
              <div className={`fa-stat-icon ${stat.color}`}>
                <Icon size={22} />
              </div>
              <p>{stat.label}</p>
              <h2>{stat.value}</h2>
              <span>{stat.note}</span>
            </article>
          );
        })}
      </div>

      <div className="fa-secondary-grid">
        <article className="fa-panel fa-chart-panel">
          <div className="fa-panel-heading">
            <div>
              <h2>Sales trend</h2>
              <p>Delivered product revenue by day</p>
            </div>
            <TrendingUp size={21} />
          </div>

          {data.salesTrend.length > 0 ? (
            <div className="fa-chart">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [money(value), "Revenue"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#218746"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="fa-empty">
              <TrendingUp size={32} />
              <strong>No delivered sales yet</strong>
              <p>Your sales trend will appear here after an order is delivered.</p>
            </div>
          )}
        </article>

        <article className="fa-panel">
          <div className="fa-panel-heading">
            <div>
              <h2>Order overview</h2>
              <p>Current order status</p>
            </div>
            <ShoppingBag size={21} />
          </div>

          <div className="fa-order-row">
            <span><CheckCircle2 size={17} /> Delivered</span>
            <strong>{summary.deliveredOrders}</strong>
          </div>
          <div className="fa-order-row">
            <span><Clock size={17} /> Pending / in progress</span>
            <strong>{summary.pendingOrders}</strong>
          </div>
          <div className="fa-order-row">
            <span><XCircle size={17} /> Cancelled</span>
            <strong>{summary.cancelledOrders}</strong>
          </div>

          <div className="fa-order-total">
            <span>Total orders</span>
            <strong>{summary.totalOrders}</strong>
          </div>
        </article>
      </div>

      <div className="fa-secondary-grid">
        <article className="fa-panel">
          <div className="fa-panel-heading">
            <div>
              <h2>Top-selling produce</h2>
              <p>Ranked by units sold</p>
            </div>
            <TrendingUp size={21} />
          </div>

          {data.topProducts.length > 0 ? (
            <div className="fa-top-products">
              {data.topProducts.map((product, index) => (
                <div
                  className="fa-product-row"
                  key={product.productId}
                >
                  <span className="fa-product-rank">
                    {index + 1}
                  </span>
                  <div className="fa-product-name">
                    <strong>{product.name}</strong>
                    <span>{product.unitsSold} units sold</span>
                  </div>
                  <strong>{money(product.revenue)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="fa-empty">
              <Package size={30} />
              <strong>No sales data yet</strong>
              <p>Delivered product sales will appear here.</p>
            </div>
          )}
        </article>

        <article className="fa-panel">
          <div className="fa-panel-heading">
            <div>
              <h2>Inventory health</h2>
              <p>Current product availability</p>
            </div>
            <Package size={21} />
          </div>

          <div className="fa-inventory-summary">
            <div>
              <span>Total products</span>
              <strong>{inventory.totalProducts}</strong>
            </div>
            <div>
              <span>Available</span>
              <strong>{inventory.availableProducts}</strong>
            </div>
            <div>
              <span>Out of stock</span>
              <strong>{inventory.outOfStock}</strong>
            </div>
          </div>

          <div className="fa-low-stock-heading">
            <AlertTriangle size={17} />
            Low-stock alerts
          </div>

          {inventory.lowStock.length > 0 ? (
            inventory.lowStock.map((product) => (
              <div
                className="fa-low-stock-row"
                key={product._id}
              >
                <span>{product.name}</span>
                <strong>
                  {product.quantity} {product.unit} left
                </strong>
              </div>
            ))
          ) : (
            <div className="fa-no-alerts">
              <CheckCircle2 size={18} />
              No low-stock products right now.
            </div>
          )}
        </article>
      </div>

      <p className="fa-footnote">
        Revenue represents product sales in delivered orders and excludes
        delivery fees. All figures are based on available database records.
      </p>
    </section>
  );
}
