import React, { useEffect, useMemo, useState } from "react";
import { Sprout, Search, ShoppingCart, UserRound, Leaf, Plus, Minus, Trash2, Package, MapPin, LogOut, CheckCircle2, Store, ArrowRight, X } from "lucide-react";

const API = "http://localhost:5000/api";
const money = n => `₹${Number(n || 0).toFixed(2).replace(/\.00$/, "")}`;
const fallbackImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600";
async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
const pid = p => p._id || p.id;

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("agri-user")); } catch { return null; } });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [screen, setScreen] = useState("home");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [auth, setAuth] = useState({ phone: "", name: "", role: "Customer", otp: "" });
  const [showAuth, setShowAuth] = useState(!user);
  const [showProduct, setShowProduct] = useState(false);
  const [editing, setEditing] = useState(null);
  const [productForm, setProductForm] = useState({ name:"", category:"Vegetables", price:"", unit:"kg", quantity:"", description:"", image:"" });
  const [checkout, setCheckout] = useState({ name:"", phone:"", address:"" });
  const notify = msg => { setToast(msg); setTimeout(() => setToast(""), 2800); };

  async function loadProducts() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "All") params.set("category", category);
      setProducts(await api(`/products${params.size ? `?${params}` : ""}`));
    } catch (e) { notify(e.message); }
  }
  async function loadOrders() {
    try { setOrders(await api("/orders")); } catch (e) { notify(e.message); }
  }
  useEffect(() => { loadProducts(); loadOrders(); }, []);
  useEffect(() => { const t = setTimeout(loadProducts, 250); return () => clearTimeout(t); }, [search, category]);
  useEffect(() => { if (user) { localStorage.setItem("agri-user", JSON.stringify(user)); setShowAuth(false); } }, [user]);

  const cartCount = cart.reduce((s, x) => s + x.quantity, 0);
  const subtotal = cart.reduce((s, x) => s + x.price * x.quantity, 0);
  const deliveryFee = subtotal === 0 || subtotal >= 300 ? 0 : 30;
  const categories = ["All", "Vegetables", "Fruits", "Leafy Greens", "Grains", "Dairy"];
  const visibleProducts = useMemo(() => products.filter(p => p.quantity > 0), [products]);

  async function login(e) {
    e.preventDefault();
    try {
      if (!auth.otp) {
        await api("/auth/otp", { method:"POST", body: JSON.stringify({ phone: auth.phone, role: auth.role }) });
        setAuth(a => ({ ...a, otp: "123456" }));
        notify("Demo OTP is 123456. Enter it to continue.");
        return;
      }
      const result = await api("/auth/verify", { method:"POST", body: JSON.stringify({ ...auth, otp: auth.otp }) });
      setUser(result.user); setCheckout(c => ({ ...c, name: result.user.name, phone: result.user.phone }));
      setShowAuth(false); notify(`Welcome to AgriCart, ${result.user.name}!`);
    } catch (e) { notify(e.message); }
  }
  function logout() { setUser(null); localStorage.removeItem("agri-user"); setShowAuth(true); setScreen("home"); setCart([]); }
  function addToCart(p) {
    if (!user) { setShowAuth(true); return; }
    if (user.role !== "Customer") { notify("Switch to Customer role to shop."); return; }
    setCart(old => {
      const found = old.find(x => x.id === pid(p));
      if (found) return old.map(x => x.id === pid(p) ? { ...x, quantity: Math.min(x.quantity + 1, p.quantity) } : x);
      return [...old, { ...p, id: pid(p), quantity: 1 }];
    });
    notify(`${p.name} added to cart`);
  }
  function changeQty(id, delta) { setCart(old => old.map(x => x.id === id ? { ...x, quantity: Math.max(1, Math.min(x.quantity + delta, products.find(p => pid(p) === id)?.quantity || x.quantity)) } : x)); }
  async function saveProduct(e) {
    e.preventDefault();
    try {
      const payload = { ...productForm, price: Number(productForm.price), quantity: Number(productForm.quantity), farmer: user?.name || "Demo Farmer", image: productForm.image || fallbackImage };
      const p = editing ? await api(`/products/${editing}`, { method:"PUT", body:JSON.stringify(payload) }) : await api("/products", { method:"POST", body:JSON.stringify(payload) });
      setProducts(old => editing ? old.map(x => pid(x) === pid(p) ? p : x) : [p, ...old]);
      setShowProduct(false); setEditing(null); setProductForm({ name:"", category:"Vegetables", price:"", unit:"kg", quantity:"", description:"", image:"" });
      notify(editing ? "Product updated" : "Product listed successfully");
    } catch (e) { notify(e.message); }
  }
  function editProduct(p) { setEditing(pid(p)); setProductForm({ name:p.name, category:p.category, price:p.price, unit:p.unit, quantity:p.quantity, description:p.description, image:p.image }); setShowProduct(true); }
  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;
    try { await api(`/products/${id}`, { method:"DELETE" }); setProducts(old => old.filter(p => pid(p) !== id)); notify("Product deleted"); }
    catch(e) { notify(e.message); }
  }
  async function placeOrder(e) {
    e.preventDefault();
    if (!cart.length) return notify("Your cart is empty.");
    setLoading(true);
    try {
      const order = await api("/orders", { method:"POST", body:JSON.stringify({ customerName:checkout.name, customerPhone:checkout.phone, address:checkout.address, items:cart.map(x => ({ productId:x.id, quantity:x.quantity })) }) });
      setCart([]); setOrders(old => [order, ...old]); await loadProducts(); setScreen("orders"); notify("Order placed successfully!");
    } catch(e) { notify(e.message); }
    finally { setLoading(false); }
  }
  async function updateOrder(id, status) {
    try { const updated = await api(`/orders/${id}/status`, { method:"PATCH", body:JSON.stringify({ status }) }); setOrders(old => old.map(o => pid(o) === pid(updated) ? updated : o)); notify(`Order marked ${status.toLowerCase()}`); }
    catch(e) { notify(e.message); }
  }

  const isFarmer = user?.role === "Farmer";
  const nav = [{ id:"home", label:"Marketplace", icon:Store }, ...(user ? [{ id:"orders", label:"Orders", icon:Package }] : []), ...(!isFarmer && user ? [{ id:"cart", label:`Cart${cartCount ? ` (${cartCount})` : ""}`, icon:ShoppingCart }] : []), ...(isFarmer ? [{ id:"manage", label:"My produce", icon:Leaf }] : [])];

  return <div className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setScreen("home")}><span className="brand-mark"><Sprout size={25}/></span><span>Agri<span>Cart</span><small>FARM FRESH. DIRECTLY TO YOU.</small></span></button>
      <div className="search-wrap"><Search size={18}/><input placeholder="Search tomatoes, fruits, greens..." value={search} onChange={e => {setSearch(e.target.value); setScreen("home");}} /></div>
      <div className="header-actions">{user ? <><span className="user-chip"><UserRound size={16}/>{user.name} <em>{user.role}</em></span><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={18}/></button></> : <button className="btn btn-primary" onClick={() => setShowAuth(true)}>Sign in</button>}</div>
    </header>
    <nav className="nav-row">{nav.map(n => <button key={n.id} className={`nav-item ${screen === n.id ? "active" : ""}`} onClick={() => setScreen(n.id)}><n.icon size={17}/>{n.label}</button>)}<span className="nav-spacer"/><span className="fresh-note"><Leaf size={15}/> Supporting local farmers</span></nav>
    <main>
      {screen === "home" && <>
        <section className="hero"><div className="hero-content"><span className="eyebrow"><Sprout size={15}/> FROM FARM TO YOUR TABLE</span><h1>Good food starts<br/>with <span>good roots.</span></h1><p>Fresh produce from local farmers, delivered with care. Shop seasonal goodness while supporting the people who grow it.</p><div className="hero-actions"><button className="btn btn-light" onClick={() => document.getElementById("products")?.scrollIntoView({behavior:"smooth"})}>Explore produce <ArrowRight size={17}/></button><span><CheckCircle2 size={16}/> Fresh · Local · Fair</span></div></div><div className="hero-image"><img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000" alt="Fresh vegetables at a market"/></div><div className="hero-badge"><span><Leaf size={18}/></span><div><strong>Grown with care</strong><small>From local farms</small></div></div></section>
        <section className="benefits"><div><span className="benefit-icon"><Sprout/></span><div><strong>Direct from farmers</strong><small>Know where your food comes from</small></div></div><div><span className="benefit-icon"><CheckCircle2/></span><div><strong>Fair, clear pricing</strong><small>Transparent prices, no surprises</small></div></div><div><span className="benefit-icon"><Package/></span><div><strong>Fresh picks</strong><small>Seasonal produce, picked with care</small></div></div></section>
        <section id="products" className="section-head"><div><span className="eyebrow green">FRESH FROM THE FARM</span><h2>Today's harvest</h2><p>Discover fresh picks from our farming community.</p></div><span className="result-count">{visibleProducts.length} products available</span></section>
        <div className="category-row">{categories.map(c=><button key={c} className="category-pill" onClick={()=>setCategory(c)}>{c}</button>)}</div>
        {visibleProducts.length ? <div className="product-grid">{visibleProducts.map(p=><ProductCard key={pid(p)} p={p} user={user} add={addToCart} edit={editProduct} del={deleteProduct}/>)}</div> : <Empty title="No produce found" text="Try another search or check back soon."/>}
      </>}
      {screen === "manage" && isFarmer && <><section className="section-head"><div><span className="eyebrow green">FARMER WORKSPACE</span><h2>My produce</h2><p>Manage your listings and keep your stock up to date.</p></div><button className="btn btn-primary" onClick={()=>{setEditing(null);setProductForm({name:"",category:"Vegetables",price:"",unit:"kg",quantity:"",description:"",image:""});setShowProduct(true);}}><Plus size={17}/> Add produce</button></section><div className="stats-row"><Stat label="My listings" value={products.filter(p=>p.farmer===user.name).length}/><Stat label="Available items" value={products.filter(p=>p.farmer===user.name&&p.quantity>0).length}/><Stat label="Total orders" value={orders.length}/></div><div className="manage-list">{products.filter(p=>p.farmer===user.name||p.farmer==="Demo Farmer").map(p=><div className="manage-item" key={pid(p)}><img src={p.image||fallbackImage} alt={p.name}/><div className="manage-info"><strong>{p.name}</strong><small>{p.category} · {p.quantity} {p.unit} in stock</small><b>{money(p.price)}/{p.unit}</b></div><button className="icon-btn" onClick={()=>editProduct(p)}>Edit</button><button className="icon-btn danger" onClick={()=>deleteProduct(pid(p))}><Trash2 size={17}/></button></div>)}</div></>}
      {screen === "cart" && <><section className="section-head"><div><span className="eyebrow green">YOUR SELECTION</span><h2>Shopping cart</h2><p>Fresh picks, ready for your table.</p></div></section>{cart.length ? <div className="checkout-layout"><div className="cart-list">{cart.map(p=><div className="cart-item" key={p.id}><img src={p.image||fallbackImage} alt={p.name}/><div className="cart-item-info"><strong>{p.name}</strong><small>{money(p.price)} / {p.unit}</small><div className="qty-control"><button onClick={()=>changeQty(p.id,-1)}><Minus size={14}/></button><span>{p.quantity}</span><button onClick={()=>changeQty(p.id,1)}><Plus size={14}/></button></div></div><b>{money(p.price*p.quantity)}</b><button className="icon-btn danger" onClick={()=>setCart(old=>old.filter(x=>x.id!==p.id))}><Trash2 size={17}/></button></div>)}</div><aside className="summary-card"><h3>Order summary</h3><Summary subtotal={subtotal} deliveryFee={deliveryFee}/><button className="btn btn-primary full" onClick={()=>setScreen("checkout")}>Continue to checkout <ArrowRight size={17}/></button></aside></div>:<Empty title="Your cart is waiting" text="Browse the marketplace and add some fresh produce." action={()=>setScreen("home")} actionText="Explore produce"/>}</>}
      {screen === "checkout" && <><section className="section-head"><div><span className="eyebrow green">ALMOST THERE</span><h2>Checkout</h2><p>Where should we deliver your fresh produce?</p></div></section><div className="checkout-layout"><form className="form-card" onSubmit={placeOrder}><h3>Delivery details</h3><label>Full name<input required value={checkout.name} onChange={e=>setCheckout({...checkout,name:e.target.value})}/></label><label>Phone number<input required value={checkout.phone} onChange={e=>setCheckout({...checkout,phone:e.target.value})}/></label><label>Delivery address<textarea required rows="3" value={checkout.address} onChange={e=>setCheckout({...checkout,address:e.target.value})} placeholder="House number, street, area, city, PIN code"/></label><div className="notice"><CheckCircle2 size={18}/> Payment method: Cash on Delivery (demo)</div><button className="btn btn-primary full" disabled={loading}>{loading?"Placing order...":"Place order · "+money(subtotal+deliveryFee)}</button></form><aside className="summary-card"><h3>Your items</h3>{cart.map(p=><div className="summary-line" key={p.id}><span>{p.name} × {p.quantity}</span><b>{money(p.price*p.quantity)}</b></div>)}<Summary subtotal={subtotal} deliveryFee={deliveryFee}/></aside></div></>}
      {screen === "orders" && <><section className="section-head"><div><span className="eyebrow green">ORDER ACTIVITY</span><h2>{isFarmer?"Incoming orders":"Your orders"}</h2><p>{isFarmer?"Keep customers updated as you prepare their produce.":"Track your fresh produce orders."}</p></div></section>{orders.length?<div className="orders-grid">{orders.map(o=><article className="order-card" key={pid(o)}><div className="order-top"><span className="order-id">ORDER #{pid(o).slice(-8).toUpperCase()}</span><span className={`status status-${o.status.toLowerCase()}`}>{o.status}</span></div><div className="order-meta"><span><UserRound size={15}/>{o.customerName}</span><span><MapPin size={15}/>{o.address}</span></div><div className="order-products">{o.items.map(i=><div key={String(i.product)}><span>{i.name} × {i.quantity}</span><b>{money(i.price*i.quantity)}</b></div>)}</div><div className="order-bottom"><span>{new Date(o.createdAt).toLocaleDateString()}</span><strong>{money(o.total)}</strong></div>{isFarmer&&<div className="order-actions">{(o.status==="Placed"?["Accepted","Cancelled"]:o.status==="Accepted"?["Packed","Cancelled"]:o.status==="Packed"?["Delivered"]:[]).map(s=><button className="btn btn-outline small" key={s} onClick={()=>updateOrder(pid(o),s)}>{s}</button>)}</div>}</article>)}</div>:<Empty title="No orders yet" text={isFarmer?"Customer orders will appear here.":"Your placed orders will appear here."} action={()=>setScreen("home")} actionText="Explore produce"/>}</>}
    </main>
    <footer><div className="footer-brand"><Sprout size={22}/> AgriCart</div><p>Connecting farms to families, one fresh basket at a time.</p><small>AgriCart student project · Demo version</small></footer>
    {showAuth&&<div className="modal-backdrop"><form className="modal-card" onSubmit={login}><button type="button" className="modal-close" onClick={()=>setShowAuth(false)}><X size={18}/></button><div className="modal-icon"><Sprout size={28}/></div><span className="eyebrow green">WELCOME TO AGRICART</span><h2>Fresh starts here.</h2><p>Sign in to shop fresh or manage your farm.</p><label>Your role<select value={auth.role} onChange={e=>setAuth({...auth,role:e.target.value,otp:""})}><option>Customer</option><option>Farmer</option></select></label><label>Mobile number<input required value={auth.phone} onChange={e=>setAuth({...auth,phone:e.target.value})} placeholder="Enter any demo number"/></label>{auth.otp&&<label>Development OTP<input required value={auth.otp} onChange={e=>setAuth({...auth,otp:e.target.value})} placeholder="123456"/><small className="hint">For this local demo, use 123456.</small></label>}<button className="btn btn-primary full">{auth.otp?"Verify & continue":"Send demo OTP"}</button><small className="modal-footnote">Development-only login. No real SMS is sent.</small></form></div>}
    {showProduct&&<div className="modal-backdrop"><form className="modal-card product-modal" onSubmit={saveProduct}><button type="button" className="modal-close" onClick={()=>setShowProduct(false)}><X size={18}/></button><span className="eyebrow green">FARMER WORKSPACE</span><h2>{editing?"Edit produce":"List new produce"}</h2><label>Product name<input required value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/></label><div className="form-two"><label>Category<select value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{categories.filter(x=>x!=="All").map(c=><option key={c}>{c}</option>)}</select></label><label>Unit<select value={productForm.unit} onChange={e=>setProductForm({...productForm,unit:e.target.value})}>{["kg","bunch","dozen","piece","litre"].map(c=><option key={c}>{c}</option>)}</select></label></div><div className="form-two"><label>Price (₹)<input type="number" min="0.01" step="0.01" required value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/></label><label>Quantity<input type="number" min="0" step="1" required value={productForm.quantity} onChange={e=>setProductForm({...productForm,quantity:e.target.value})}/></label></div><label>Description<textarea rows="2" value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})}/></label><label>Image URL (optional)<input value={productForm.image} onChange={e=>setProductForm({...productForm,image:e.target.value})} placeholder="https://..."/></label><button className="btn btn-primary full">{editing?"Save changes":"Publish listing"}</button></form></div>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/>{toast}</div>}
  </div>;
}
function ProductCard({p,user,add,edit,del}) { const id=pid(p); return <article className="product-card"><div className="product-image"><img src={p.image||fallbackImage} alt={p.name} onError={e=>{e.currentTarget.src=fallbackImage}}/><span className="product-tag">{p.category}</span></div><div className="product-content"><div className="product-farmer"><Sprout size={13}/>{p.farmer}</div><h3>{p.name}</h3><p>{p.description||"Fresh produce from a local farm."}</p><div className="product-stock">{p.quantity>0?`${p.quantity} ${p.unit} available`:"Out of stock"}</div><div className="product-bottom"><div><strong>{money(p.price)}</strong><small> / {p.unit}</small></div>{user?.role==="Farmer"?<div className="card-actions"><button className="icon-btn" onClick={()=>edit(p)}>Edit</button><button className="icon-btn danger" onClick={()=>del(id)}><Trash2 size={16}/></button></div>:<button className="add-btn" disabled={!p.quantity} onClick={()=>add(p)}><Plus size={16}/> Add</button>}</div></div></article>; }
function Summary({subtotal,deliveryFee}) { return <><div className="summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div><div className="summary-line"><span>Delivery</span><b>{deliveryFee?money(deliveryFee):"Free"}</b></div><div className="summary-total"><span>Total</span><strong>{money(subtotal+deliveryFee)}</strong></div><small className="hint">Free delivery on orders of ₹300 or more.</small></>; }
function Stat({label,value}) { return <div className="stat-card"><small>{label}</small><strong>{value}</strong></div>; }
function Empty({title,text,action,actionText}) { return <div className="empty-state"><span><Package size={27}/></span><h3>{title}</h3><p>{text}</p>{action&&<button className="btn btn-primary" onClick={action}>{actionText}</button>}</div>; }
