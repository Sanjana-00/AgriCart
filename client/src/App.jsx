import Reviews from "./components/Reviews.jsx";
import ProductCard from "./components/ProductCard.jsx";
import Summary from "./components/Summary.jsx";
import Stat from "./components/Stat.jsx";
import Empty from "./components/Empty.jsx";
import Footer from "./components/Footer.jsx";
import Header from "./components/Header.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import Manage from "./pages/Manage.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Orders from "./pages/Orders.jsx";
import AuthModal from "./components/AuthModal.jsx";
import ProductModal from "./components/ProductModal.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Toast from "./components/Toast.jsx";
import translations from "./data/translations.js";
import FarmerAnalytics from "./components/FarmerAnalytics.jsx";
import AIShoppingAssistant from "./components/AIShoppingAssistant.jsx";
import SurplusManagement from "./components/SurplusManagement.jsx";
import SurplusDeals from "./components/SurplusDeals.jsx";
import React, { useEffect, useMemo, useState } from "react";
import {
  Sprout,
  Search,
  ShoppingCart,
  UserRound,
  Leaf,
  Plus,
  Minus,
  Trash2,
  Package,
  MapPin,
  LogOut,
  CheckCircle2,
  Store,
  ArrowRight,
  X,
  TrendingUp
} from "lucide-react";



const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

const money = (n) =>
  `₹${Number(n || 0).toFixed(2).replace(/\.00$/, "")}`;

const fallbackImage =
  "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600";

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

const pid = (p) => p._id || p.id;

export default function App() {

  const [theme, setTheme] = useState(
  () => localStorage.getItem("agricart-theme") || "light"
);

useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("agricart-theme", theme);
}, [theme]);

function toggleTheme() {
  setTheme((current) => (current === "light" ? "dark" : "light"));
}

  const [language, setLanguage] = useState(
  () => localStorage.getItem("agricart-language") || "English"
);

const t = translations[language];

function changeLanguage(event) {
  const selectedLanguage = event.target.value;
  setLanguage(selectedLanguage);
  localStorage.setItem("agricart-language", selectedLanguage);
}
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agri-user"));
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [screen, setScreen] = useState("home");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [auth, setAuth] = useState({
    phone: "",
    name: "",
    role: "Customer",
    otp: ""
  });

  const [showAuth, setShowAuth] = useState(!user);
  const [showProduct, setShowProduct] = useState(false);
  const [editing, setEditing] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    category: "Vegetables",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    image: ""
  });

  const [checkout, setCheckout] = useState({
    name: "",
    phone: "",
    address: ""
  });

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  async function loadProducts() {
    try {
      const params = new URLSearchParams();

      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);

      const result = await api(
        `/products${params.size ? `?${params}` : ""}`
      );

      setProducts(result);
    } catch (e) {
      notify(e.message);
    }
  }

  async function loadOrders() {
    try {
      setOrders(await api("/orders"));
    } catch (e) {
      notify(e.message);
    }
  }

  useEffect(() => {
    loadProducts();
    loadOrders();
  }, []);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 250);
    return () => clearTimeout(timer);
  }, [search, category]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("agri-user", JSON.stringify(user));
      setShowAuth(false);
    }
  }, [user]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee =
    subtotal === 0 || subtotal >= 300 ? 0 : 30;

  const categories = [
    "All",
    "Vegetables",
    "Fruits",
    "Leafy Greens",
    "Grains",
    "Dairy"
  ];

  const visibleProducts = useMemo(
    () => products.filter((p) => p.quantity > 0),
    [products]
  );

  async function login(e) {
    e.preventDefault();

    try {
      if (!auth.otp) {
        await api("/auth/otp", {
          method: "POST",
          body: JSON.stringify({
            phone: auth.phone,
            role: auth.role
          })
        });

        setAuth((a) => ({ ...a, otp: "123456" }));

        notify("Demo OTP is 123456. Enter it to continue.");
        return;
      }

      const result = await api("/auth/verify", {
        method: "POST",
        body: JSON.stringify({
          ...auth,
          otp: auth.otp
        })
      });

      setUser(result.user);

      setCheckout((c) => ({
        ...c,
        name: result.user.name,
        phone: result.user.phone
      }));

      setShowAuth(false);

      notify(`Welcome to AgriCart, ${result.user.name}!`);
    } catch (e) {
      notify(e.message);
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("agri-user");
    setShowAuth(true);
    setScreen("home");
    setSelectedProduct(null);
    setCart([]);
  }

  function openProduct(product) {
    setSelectedProduct(product);
    setScreen("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(p) {
  if (!user) {
    setShowAuth(true);
    return;
  }

  if (user.role !== "Customer") {
    notify("Switch to Customer role to shop.");
    return;
  }

  const productId = pid(p);
  const isSurplus = p.isSurplus === true;
  const cartId = isSurplus
    ? `${productId}-surplus`
    : productId;

  const availableQuantity = Number(p.quantity);
  const price = Number(p.price);

  if (
    !Number.isFinite(availableQuantity) ||
    availableQuantity <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    notify("This product is currently unavailable.");
    return;
  }

  setCart((old) => {
    const found = old.find((item) => item.id === cartId);

    if (found) {
      if (found.quantity >= availableQuantity) {
        notify("You have reached the available quantity.");
        return old;
      }

      return old.map((item) =>
        item.id === cartId
          ? {
              ...item,
              quantity: Math.min(
                item.quantity + 1,
                availableQuantity
              )
            }
          : item
      );
    }

    return [
      ...old,
      {
        ...p,
        id: cartId,
        productId,
        isSurplus,
        price,
        quantity: 1
      }
    ];
  });

  notify(`${p.name} added to cart`);
}

  function changeQty(id, delta) {
  setCart((old) =>
    old.map((item) => {
      if (item.id !== id) return item;

      const availableQuantity = item.isSurplus
        ? Number(item.quantityAvailable ?? item.quantity)
        : Number(
            products.find((p) => pid(p) === (item.productId || item.id))
              ?.quantity ?? item.quantity
          );

      return {
        ...item,
        quantity: Math.max(
          1,
          Math.min(item.quantity + delta, availableQuantity)
        )
      };
    })
  );
}

  async function saveProduct(e) {
    e.preventDefault();

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        quantity: Number(productForm.quantity),
        farmer: user?.name || "Demo Farmer",
        image: productForm.image || fallbackImage
      };

      const p = editing
        ? await api(`/products/${editing}`, {
            method: "PUT",
            body: JSON.stringify(payload)
          })
        : await api("/products", {
            method: "POST",
            body: JSON.stringify(payload)
          });

      setProducts((old) =>
        editing
          ? old.map((x) => (pid(x) === pid(p) ? p : x))
          : [p, ...old]
      );

      setShowProduct(false);
      setEditing(null);

      setProductForm({
        name: "",
        category: "Vegetables",
        price: "",
        unit: "kg",
        quantity: "",
        description: "",
        image: ""
      });

      notify(
        editing
          ? "Product updated"
          : "Product listed successfully"
      );
    } catch (e) {
      notify(e.message);
    }
  }

  function editProduct(p) {
    setEditing(pid(p));

    setProductForm({
      name: p.name,
      category: p.category,
      price: p.price,
      unit: p.unit,
      quantity: p.quantity,
      description: p.description,
      image: p.image
    });

    setShowProduct(true);
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    try {
      await api(`/products/${id}`, {
        method: "DELETE"
      });

      setProducts((old) =>
        old.filter((p) => pid(p) !== id)
      );

      notify("Product deleted");
    } catch (e) {
      notify(e.message);
    }
  }

  async function placeOrder(e) {
  e.preventDefault();

  if (!cart.length) {
    return notify("Your cart is empty.");
  }

  setLoading(true);

  try {
    const order = await api("/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: checkout.name,
        customerPhone: checkout.phone,
        address: checkout.address,
        items: cart.map((item) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          isSurplus: item.isSurplus === true
        }))
      })
    });

    setCart([]);
    setOrders((old) => [order, ...old]);

    await loadProducts();

    setScreen("orders");
    notify("Order placed successfully!");
  } catch (e) {
    notify(e.message);
  } finally {
    setLoading(false);
  }
}

  async function updateOrder(id, status) {
    try {
      const updated = await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });

      setOrders((old) =>
        old.map((o) =>
          pid(o) === pid(updated) ? updated : o
        )
      );

      notify(`Order marked ${status.toLowerCase()}`);
    } catch (e) {
      notify(e.message);
    }
  }

  const isFarmer = user?.role === "Farmer";

  const nav = [
    { id: "home", label: "Marketplace", icon: Store },
    ...(user
      ? [{ id: "orders", label: "Orders", icon: Package }]
      : []),
    ...(!isFarmer && user
      ? [
          {
            id: "cart",
            label: `Cart${cartCount ? ` (${cartCount})` : ""}`,
            icon: ShoppingCart
          }
        ]
      : []),
    ...(isFarmer
  ? [
      { id: "manage", label: "My produce", icon: Leaf },
      {
        id: "analytics",
        label: "Analytics",
        icon: TrendingUp
      }
    ]
  : [])
  ];

  return (
    <div className="app-shell">
      
<Header
  user={user}
  search={search}
  setSearch={setSearch}
  setScreen={setScreen}
  setSelectedProduct={setSelectedProduct}
  language={language}
  t={t}
  theme={theme}
toggleTheme={toggleTheme}
  changeLanguage={changeLanguage}
  setShowAuth={setShowAuth}
  logout={logout}
/>    
<Navbar
  user={user}
  screen={screen}
  setScreen={setScreen}
  t={t}
  setSelectedProduct={setSelectedProduct}
  cartCount={cartCount}
/>
      <main>
       
{screen === "home" && (
  <Home
    visibleProducts={visibleProducts}
    categories={categories}
    category={category}
    setCategory={setCategory}
    user={user}
    addToCart={addToCart}
    t={t}
    editProduct={editProduct}
    deleteProduct={deleteProduct}
    openProduct={openProduct}
    pid={pid}
  />
)}
 

        {/* PRODUCT DETAILS AND REVIEWS PAGE */}
        
{screen === "product" && selectedProduct && (
  <ProductDetails
    selectedProduct={selectedProduct}
    fallbackImage={fallbackImage}
    setScreen={setScreen}
    setSelectedProduct={setSelectedProduct}
    money={money}
    user={user}
    addToCart={addToCart}
    pid={pid}
  />
)}


        
{screen === "manage" && isFarmer && (
  <Manage
    user={user}
    products={products}
    orders={orders}
    pid={pid}
    money={money}
    fallbackImage={fallbackImage}
    editProduct={editProduct}
    deleteProduct={deleteProduct}
    setEditing={setEditing}
    setProductForm={setProductForm}
    setShowProduct={setShowProduct}
  />
)}

{screen === "surplus-manage" && isFarmer && (
  <SurplusManagement user={user} />
)}

{screen === "surplus" && !isFarmer && (
  <SurplusDeals addToCart={addToCart} />
)}

{screen === "analytics" && isFarmer && (
  <FarmerAnalytics user={user} />
)}

      
{screen === "cart" && (
  <Cart
    cart={cart}
    setCart={setCart}
    changeQty={changeQty}
    money={money}
    subtotal={subtotal}
    deliveryFee={deliveryFee}
    setScreen={setScreen}
  />
)}

       
{screen === "checkout" && (
  <Checkout
    checkout={checkout}
    setCheckout={setCheckout}
    placeOrder={placeOrder}
    loading={loading}
    money={money}
    cart={cart}
    subtotal={subtotal}
    deliveryFee={deliveryFee}
  />
)}


       
{screen === "orders" && (
  <Orders
    orders={orders}
    isFarmer={isFarmer}
    pid={pid}
    money={money}
    updateOrder={updateOrder}
    setScreen={setScreen}
  />
)}

      </main>

      
{showAuth && (
  <AuthModal
    auth={auth}
    setAuth={setAuth}
    login={login}
    setShowAuth={setShowAuth}
  />
)}


      
{showProduct && (
  <ProductModal
    editing={editing}
    productForm={productForm}
    setProductForm={setProductForm}
    categories={categories}
    saveProduct={saveProduct}
    setShowProduct={setShowProduct}
  />
)}


     <Toast message={toast} />

<AIShoppingAssistant
  addToCart={addToCart}
  user={user}
/>
</div>
  );
}

