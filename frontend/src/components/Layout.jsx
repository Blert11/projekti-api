import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/books', label: 'Books' },
  { to: '/authors', label: 'Authors' },
  { to: '/categories', label: 'Categories' },
  { to: '/loans', label: 'Loans' },
  { to: '/members', label: 'Members', roles: ['ADMIN', 'LIBRARIAN'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <header className="navbar">
        <NavLink to="/" className="navbar-brand">
          📚 Library
        </NavLink>

        <button className="navbar-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          ☰
        </button>

        <nav className={`navbar-links ${open ? 'open' : ''}`}>
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            Profile
          </NavLink>
        </nav>

        <div className="navbar-user">
          <span className="badge badge-role">{user?.name}</span>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
