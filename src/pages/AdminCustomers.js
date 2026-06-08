import React, { useEffect, useMemo, useState } from "react";
import "./AdminCustomers.css";

const API_BASE_URL = "https://vandhana-scratch-card-backend.vercel.app";

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/customers`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to fetch customers");
        return;
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch {
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return customers;

    return customers.filter((customer) => {
      const values = [
        customer.customer_name,
        customer.mobile_number,
        customer.gender,
        customer.city,
        customer.marital_status,
        customer.shopping_preference,
        customer.spouse_name,
        customer.whatsapp_opt_in ? "whatsapp yes opted in consent yes" : "whatsapp no opted out consent no"
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const childValues = Array.isArray(customer.children)
        ? customer.children
            .map((child) => `${child.childName || ""} ${child.childDob || ""}`)
            .join(" ")
            .toLowerCase()
        : "";

      return values.includes(term) || childValues.includes(term);
    });
  }, [customers, search]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const consentCount = useMemo(
    () => customers.filter((customer) => customer.whatsapp_opt_in).length,
    [customers]
  );

  return (
    <div className="ac-wrap">
      <div className="ac-shell">
        <div className="ac-topbar">
          <div>
            <p className="ac-kicker">Admin Panel</p>
            <h1>Customer Submissions</h1>
            <p className="ac-subtitle">
              View all submitted customer details, family information and WhatsApp consent status.
            </p>
          </div>

          <button className="ac-refresh-btn" onClick={fetchCustomers}>
            Refresh
          </button>
        </div>

        <div className="ac-toolbar">
          <div className="ac-search-box">
            <input
              type="text"
              placeholder="Search by customer, mobile, city, status, spouse, child or WhatsApp consent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="ac-summary">
            <div className="ac-summary-card">
              <span>Total Records</span>
              <strong>{customers.length}</strong>
            </div>
            <div className="ac-summary-card">
              <span>Showing</span>
              <strong>{filteredCustomers.length}</strong>
            </div>
            <div className="ac-summary-card">
              <span>WhatsApp Opt-ins</span>
              <strong>{consentCount}</strong>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ac-state-card">Loading customer data...</div>
        ) : error ? (
          <div className="ac-state-card ac-error">{error}</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="ac-state-card">No customer records found.</div>
        ) : (
          <div className="ac-table-container">
            <table className="ac-main-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Mobile Number</th>
                  <th>WhatsApp Consent</th>
                  <th>Opt-in Date</th>
                  <th>Gender</th>
                  <th>Date of Birth</th>
                  <th>Marital Status</th>
                  <th>Wife Name</th>
                  <th>Wife DOB</th>
                  <th>Has Children</th>
                  <th>Children Details</th>
                  <th>Shopping Preference</th>
                  <th>City</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.id}</td>
                    <td>{customer.customer_name || "-"}</td>
                    <td>{customer.mobile_number || "-"}</td>
                    <td>
                      <span
                        className={`ac-status-badge ${
                          customer.whatsapp_opt_in ? "ac-status-yes" : "ac-status-no"
                        }`}
                      >
                        {customer.whatsapp_opt_in ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>{formatDateTime(customer.whatsapp_opt_in_at)}</td>
                    <td>{customer.gender || "-"}</td>
                    <td>{formatDate(customer.date_of_birth)}</td>
                    <td>{customer.marital_status || "-"}</td>
                    <td>{customer.spouse_name || "-"}</td>
                    <td>{formatDate(customer.spouse_dob)}</td>
                    <td>
                      <span
                        className={`ac-status-badge ${
                          customer.has_children ? "ac-status-yes" : "ac-status-no"
                        }`}
                      >
                        {customer.has_children ? "Yes" : "No"}
                      </span>
                    </td>
                    <td>
                      {customer.children && customer.children.length > 0 ? (
                        <div className="ac-children-table-wrap">
                          <table className="ac-children-table">
                            <thead>
                              <tr>
                                <th>S.No</th>
                                <th>Name</th>
                                <th>DOB</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customer.children.map((child, index) => (
                                <tr key={child.id || index}>
                                  <td>{index + 1}</td>
                                  <td>{child.childName || "-"}</td>
                                  <td>{formatDate(child.childDob)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="ac-empty-text">No children</span>
                      )}
                    </td>
                    <td>{customer.shopping_preference || "-"}</td>
                    <td>{customer.city || "-"}</td>
                    <td>{formatDateTime(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}