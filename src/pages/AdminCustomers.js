import React, { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://vandhana-scratch-card-backend.vercel.app";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const escapeCsvValue = (value) => {
  const normalizedValue =
    value === null || value === undefined ? "" : String(value);

  return `"${normalizedValue.replace(/"/g, '""')}"`;
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchCustomers = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(`${API_BASE_URL}/api/admin/customers`);
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch customers");
      }

      setCustomers(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message || "Unable to connect to the backend");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customers;
    }

    return customers.filter((customer) => {
      const childrenText = Array.isArray(customer.children)
        ? customer.children
            .map(
              (child) =>
                `${child.childName || ""} ${child.childDob || ""}`
            )
            .join(" ")
        : "";

      const searchableText = [
        customer.id,
        customer.customer_name,
        customer.mobile_number,
        customer.gender,
        customer.city,
        customer.marital_status,
        customer.spouse_name,
        customer.shopping_preference,
        customer.reward_label,
        customer.reward_type,
        customer.reward_claim_status,
        childrenText
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        )
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [customers, search]);

  const summary = useMemo(() => {
    const whatsappOptIns = customers.filter(
      (customer) => customer.whatsapp_opt_in
    ).length;

    const spunCustomers = customers.filter(
      (customer) => customer.spin_result_id
    ).length;

    const claimedRewards = customers.filter((customer) =>
      ["claimed", "redeemed"].includes(customer.reward_claim_status)
    ).length;

    return {
      total: customers.length,
      whatsappOptIns,
      spunCustomers,
      claimedRewards
    };
  }, [customers]);

  const exportCustomers = () => {
    const headers = [
      "Customer ID",
      "Customer Name",
      "Mobile Number",
      "Gender",
      "Date of Birth",
      "Marital Status",
      "Spouse Name",
      "Spouse Date of Birth",
      "Has Children",
      "Children",
      "Shopping Preference",
      "City",
      "WhatsApp Opt In",
      "Reward",
      "Reward Type",
      "Discount Percent",
      "Claim Status",
      "Spin Time",
      "Created At"
    ];

    const rows = filteredCustomers.map((customer) => {
      const childrenText = Array.isArray(customer.children)
        ? customer.children
            .map(
              (child) =>
                `${child.childName || "-"} (${formatDate(child.childDob)})`
            )
            .join(", ")
        : "";

      return [
        customer.id,
        customer.customer_name,
        customer.mobile_number,
        customer.gender,
        formatDate(customer.date_of_birth),
        customer.marital_status,
        customer.spouse_name,
        formatDate(customer.spouse_dob),
        customer.has_children ? "Yes" : "No",
        childrenText,
        customer.shopping_preference,
        customer.city,
        customer.whatsapp_opt_in ? "Yes" : "No",
        customer.reward_label,
        customer.reward_type,
        customer.reward_discount_percent,
        customer.reward_claim_status,
        formatDateTime(customer.spun_at),
        formatDateTime(customer.created_at)
      ];
    });

    const csvContent = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((row) => row.map(escapeCsvValue).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8"
    });

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `vandhana-customers-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-page-kicker">Customer Management</span>
          <h2>Customer Submissions</h2>
          <p>
            View customer details, family information, WhatsApp consent and
            rewards.
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={exportCustomers}
            disabled={filteredCustomers.length === 0}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="admin-button admin-button-primary"
            onClick={() => fetchCustomers(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>Total Customers</span>
          <strong>{summary.total}</strong>
          <small>Registered entries</small>
        </div>

        <div className="admin-summary-card">
          <span>Wheel Spins</span>
          <strong>{summary.spunCustomers}</strong>
          <small>Customers who spun</small>
        </div>

        <div className="admin-summary-card">
          <span>Rewards Claimed</span>
          <strong>{summary.claimedRewards}</strong>
          <small>Claimed or redeemed</small>
        </div>

        <div className="admin-summary-card">
          <span>WhatsApp Opt-ins</span>
          <strong>{summary.whatsappOptIns}</strong>
          <small>Marketing consent</small>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-toolbar">
          <div className="admin-search-field">
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search name, mobile, city, reward or family member"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="admin-result-count">
            Showing {filteredCustomers.length} of {customers.length}
          </div>
        </div>

        {loading ? (
          <div className="admin-state">
            <div className="admin-loader" />
            <h3>Loading customers</h3>
            <p>Please wait while customer records are loaded.</p>
          </div>
        ) : error ? (
          <div className="admin-state admin-state-error">
            <h3>Unable to load customers</h3>
            <p>{error}</p>

            <button
              type="button"
              className="admin-button admin-button-primary"
              onClick={() => fetchCustomers()}
            >
              Try Again
            </button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="admin-state">
            <h3>No customer records found</h3>
            <p>Try changing the search text or refresh the page.</p>
          </div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-customer-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Personal Details</th>
                  <th>Family Details</th>
                  <th>Preference</th>
                  <th>WhatsApp</th>
                  <th>Reward</th>
                  <th>Claim Status</th>
                  <th>Registered</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <span className="admin-id-badge">#{customer.id}</span>
                    </td>

                    <td>
                      <div className="admin-primary-cell">
                        <strong>{customer.customer_name || "-"}</strong>
                        <span>{customer.gender || "-"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-primary-cell">
                        <strong>{customer.mobile_number || "-"}</strong>
                        <span>{customer.city || "-"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="admin-detail-list">
                        <span>
                          DOB: {formatDate(customer.date_of_birth)}
                        </span>
                        <span>
                          Status: {customer.marital_status || "-"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {customer.marital_status === "Married" ? (
                        <div className="admin-family-cell">
                          <div>
                            <strong>{customer.spouse_name || "-"}</strong>
                            <span>{formatDate(customer.spouse_dob)}</span>
                          </div>

                          {Array.isArray(customer.children) &&
                          customer.children.length > 0 ? (
                            <div className="admin-children-list">
                              {customer.children.map((child, index) => (
                                <span key={child.id || index}>
                                  {child.childName || "-"} ·{" "}
                                  {formatDate(child.childDob)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <small>No children</small>
                          )}
                        </div>
                      ) : (
                        <span className="admin-muted-text">Not applicable</span>
                      )}
                    </td>

                    <td>{customer.shopping_preference || "-"}</td>

                    <td>
                      <span
                        className={`admin-status-badge ${
                          customer.whatsapp_opt_in
                            ? "admin-status-success"
                            : "admin-status-neutral"
                        }`}
                      >
                        {customer.whatsapp_opt_in ? "Opted In" : "Not Opted"}
                      </span>
                    </td>

                    <td>
                      {customer.reward_label ? (
                        <div className="admin-reward-cell">
                          <strong>{customer.reward_label}</strong>

                          <span>
                            {customer.reward_type === "discount" &&
                            customer.reward_discount_percent
                              ? `${Number(
                                  customer.reward_discount_percent
                                )}% discount`
                              : customer.reward_type || "-"}
                          </span>

                          <small>{formatDateTime(customer.spun_at)}</small>
                        </div>
                      ) : (
                        <span className="admin-status-badge admin-status-warning">
                          Not Spun
                        </span>
                      )}
                    </td>

                    <td>
                      {customer.reward_claim_status ? (
                        <span
                          className={`admin-status-badge admin-claim-${customer.reward_claim_status}`}
                        >
                          {customer.reward_claim_status.replace(/_/g, " ")}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{formatDateTime(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}