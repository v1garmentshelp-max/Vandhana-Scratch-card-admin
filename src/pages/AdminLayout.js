import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./AdminLayout.css";

const navigation = [
  {
    path: "/customers",
    label: "Customers"
  },
  {
    path: "/wheel-settings",
    label: "Wheel Settings"
  },
  {
    path: "/spin-results",
    label: "Spin Results"
  }
];

export default function AdminLayout() {
  return (
    <div className="admin-app">
      <header className="admin-topbar">
        <NavLink to="/customers" className="admin-navbar-brand">
          <div className="admin-navbar-logo">V</div>

          <div className="admin-navbar-brand-text">
            <h1>Vandhana Shopping Mall</h1>
            <span>Rewards Administration</span>
          </div>
        </NavLink>

        <div className="admin-navbar-right">
          <nav className="admin-top-navigation">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `admin-top-navigation-link ${
                    isActive ? "admin-top-navigation-link-active" : ""
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="admin-navbar-status">
            <span className="admin-status-dot" />
            <span>Active</span>
          </div>
        </div>
      </header>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}