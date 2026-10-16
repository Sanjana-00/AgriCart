
import React from "react";
import {
  Sprout,
  Search,
  UserRound,
  LogOut,
  Sun,
  Moon
} from "lucide-react";

export default function Header({
  user,
  search,
  setSearch,
  setScreen,
  setSelectedProduct,
  language,
  theme,
  t,
  changeLanguage,
  toggleTheme,
  setShowAuth,
  logout
}) {
  return (
    <header className="topbar">
      <button
        className="brand"
        onClick={() => {
          setScreen("home");
          setSelectedProduct(null);
        }}
      >
        <span className="brand-mark">
          <Sprout size={25} />
        </span>

        <span>
          Agri<span>Cart</span>
          <small>FARM FRESH. DIRECTLY TO YOU.</small>
        </span>
      </button>

      <div className="search-wrap">
        <Search size={18} />

       <input
  placeholder={t.search}
  value={search}
  onChange={(e) => {
    setSearch(e.target.value);
    setScreen("home");
  }}
/>
      </div>

      <select
        value={language}
        onChange={changeLanguage}
        aria-label="Select language"
        className="language-select"
      >
        <option value="English">English</option>
        <option value="Kannada">ಕನ್ನಡ</option>
        <option value="Hindi">हिन्दी</option>
      </select>

      <div className="header-actions">

        <button
  type="button"
  className="icon-btn theme-toggle"
  onClick={toggleTheme}
  title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
>
  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
</button>

        {user ? (
          <>
            <span className="user-chip">
              <UserRound size={16} />
              {user.name}
              <em>{user.role}</em>
            </span>

            <button
              className="icon-btn"
              title="Log out"
              onClick={logout}
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => setShowAuth(true)}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
