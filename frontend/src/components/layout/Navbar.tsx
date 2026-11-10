
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Menu,
  ShoppingCart,
  X,
  UserRound,
  LogOut,
  LogIn,
  UserPlus,
  Sun,
  Moon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  const isLight = theme === "light";

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: "AI Assistant", path: "/ai-assistant" },
    { name: "About Us", path: "/about" },
  ];

  const privateLinks = [
    { name: "Marketplace", path: "/marketplace" },
    { name: "AI Recommendations", path: "/ai-recommendations" },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap text-sm transition ${
      isActive
        ? "font-semibold text-emerald-500"
        : "text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
    }`;

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMenuOpen(false);
      navigate("/");
    }
  };

  const themeButton = (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
      title={`Switch to ${isLight ? "dark" : "light"} theme`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] transition hover:border-emerald-400 hover:text-emerald-500"
    >
      {isLight ? <Moon size={19} /> : <Sun size={19} />}
    </button>
  );

  const renderLinks = () => (
    <>
      {publicLinks.map((link) => (
        <NavLink
          key={link.path}
          to={link.path}
          onClick={() => setMenuOpen(false)}
          className={linkClass}
        >
          {link.name}
        </NavLink>
      ))}

      {isAuthenticated &&
        privateLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            onClick={() => setMenuOpen(false)}
            className={linkClass}
          >
            {link.name}
          </NavLink>
        ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--theme-border)] bg-[var(--theme-nav)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-4 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-slate-950">
            <BookOpen size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-[var(--theme-text)]">
              Skill<span className="text-emerald-500">ora</span>
            </h1>

            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--theme-muted)]">
              Learn without limits
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-5 md:flex xl:gap-7">
          {renderLinks()}
        </div>

        {/* Desktop Actions */}
        <div className="hidden shrink-0 items-center gap-3 md:flex">
          {themeButton}

          {isAuthenticated ? (
            <>
              <Link
                to="/cart"
                aria-label="Shopping cart"
                className="text-[var(--theme-muted)] transition hover:text-emerald-500"
              >
                <ShoppingCart size={21} />
              </Link>

              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-3 py-2.5 text-sm text-[var(--theme-text)] transition hover:border-emerald-400"
              >
                <UserRound size={17} />
                <span>{user?.name?.split(" ")[0] || "Profile"}</span>
              </Link>

              <Link
                to="/dashboard"
                className="rounded-xl border border-[var(--theme-border)] px-4 py-2.5 text-sm text-[var(--theme-text)] transition hover:border-emerald-400"
              >
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[var(--theme-muted)] transition hover:text-red-500"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] px-4 py-2.5 text-sm font-medium text-[var(--theme-text)] transition hover:border-emerald-400 hover:text-emerald-500"
              >
                <LogIn size={16} />
                Login
              </Link>

              <Link
                to="/register"
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Sign Up
                <UserPlus size={16} />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-3 md:hidden">
          {themeButton}

          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-[var(--theme-text)]"
          >
            {menuOpen ? <X size={25} /> : <Menu size={25} />}
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-[var(--theme-border)] bg-[var(--theme-nav)] px-6 py-5 md:hidden">
          <div className="flex flex-col gap-5">
            {renderLinks()}

            <div className="flex flex-col gap-4 border-t border-[var(--theme-border)] pt-5">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/cart"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-[var(--theme-text)]"
                  >
                    <ShoppingCart size={18} />
                    Shopping Cart
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-[var(--theme-text)]"
                  >
                    <UserRound size={18} />
                    My Profile
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm text-[var(--theme-text)]"
                  >
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-left text-sm text-red-500"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm text-[var(--theme-text)]"
                  >
                    <LogIn size={18} />
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950"
                  >
                    <UserPlus size={18} />
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
