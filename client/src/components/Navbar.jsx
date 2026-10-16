
import React from "react";
import { Store, Package, ShoppingCart, Leaf } from "lucide-react";

export default function Navbar({
  user,
  screen,
  setScreen,
  setSelectedProduct,
  cartCount,
  t
}) {
  const isFarmer = user?.role === "Farmer";

  const nav = [
    { id: "home", label: t.marketplace, icon: Store },
    ...(user
      ? [{ id: "orders", label: t.orders, icon: Package }]
      : []),
    ...(!isFarmer && user
      ? [{
          id: "cart",
          label: `${t.cart}${cartCount ? ` (${cartCount})` : ""}`,
          icon: ShoppingCart
        }]
      : []),
    ...(isFarmer
      ? [{ id: "manage", label: t.myProduce, icon: Leaf }]
      : [])
  ];

  return (
    <nav className="nav-row">
      {nav.map((n) => (
        <button
          key={n.id}
          className={`nav-item ${screen === n.id ? "active" : ""}`}
          onClick={() => {
            setScreen(n.id);
            if (n.id !== "product") {
              setSelectedProduct(null);
            }
          }}
        >
          <n.icon size={17} />
          {n.label}
        </button>
      ))}

      <span className="nav-spacer" />

      <span className="fresh-note">
        <Leaf size={15} /> {t.supportingFarmers}
      </span>
    </nav>
  );
}
