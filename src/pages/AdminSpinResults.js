import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://vandhana-scratch-card-backend.vercel.app";

const claimStatusOptions = [
  {
    value: "",
    label: "All Statuses"
  },
  {
    value: "pending",
    label: "Pending"
  },
  {
    value: "claimed",
    label: "Claimed"
  },
  {
    value: "redeemed",
    label: "Redeemed"
  },
  {
    value: "not_applicable",
    label: "Not Applicable"
  }
];

const rewardTypeOptions = [
  {
    value: "",
    label: "All Reward Types"
  },
  {
    value: "discount",
    label: "Discount"
  },
  {
    value: "prize",
    label: "Prize"
  },
  {
    value: "no_win",
    label: "Better Luck"
  }
];

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

export default function AdminSpinResults() {
  const [results, setResults] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rewardType, setRewardType] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSpinResults = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit)
        });

        if (appliedSearch) {
          params.set("search", appliedSearch);
        }

        if (status) {
          params.set("status", status);
        }

        if (rewardType) {
          params.set("rewardType", rewardType);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/admin/spins?${params.toString()}`
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch spin results"
          );
        }

        setResults(Array.isArray(data.results) ? data.results : []);
        setTotal(Number(data.total || 0));
        setTotalPages(Math.max(Number(data.totalPages || 1), 1));
      } catch (requestError) {
        setError(
          requestError.message || "Unable to connect to the backend"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, limit, appliedSearch, status, rewardType]
  );

  useEffect(() => {
    loadSpinResults();
  }, [loadSpinResults]);

  const summary = useMemo(() => {
    const pending = results.filter(
      (result) => result.claimStatus === "pending"
    ).length;

    const claimed = results.filter(
      (result) => result.claimStatus === "claimed"
    ).length;

    const redeemed = results.filter(
      (result) => result.claimStatus === "redeemed"
    ).length;

    const special = results.filter(
      (result) => result.selectionPool === "special"
    ).length;

    return {
      pending,
      claimed,
      redeemed,
      special
    };
  }, [results]);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
    setMessage("");
  };

  const clearFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatus("");
    setRewardType("");
    setPage(1);
    setMessage("");
    setError("");
  };

  const updateClaimStatus = async (spinId, claimStatus) => {
    try {
      setUpdatingId(spinId);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_BASE_URL}/api/admin/spins/${spinId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            claimStatus
          })
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update spin status"
        );
      }

      setResults((currentResults) =>
        currentResults.map((result) =>
          result.id === spinId
            ? {
                ...result,
                ...data.result
              }
            : result
        )
      );

      setMessage("Reward status updated successfully");
    } catch (requestError) {
      setError(
        requestError.message || "Unable to update reward status"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <span className="admin-page-kicker">Reward History</span>
          <h2>Spin Results</h2>
          <p>
            Review customer spins and update reward claim or redemption
            status.
          </p>
        </div>

        <button
          type="button"
          className="admin-button admin-button-primary"
          onClick={() => loadSpinResults(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Results"}
        </button>
      </div>

      {error ? (
        <div className="admin-alert admin-alert-error">{error}</div>
      ) : null}

      {message ? (
        <div className="admin-alert admin-alert-success">{message}</div>
      ) : null}

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span>Total Results</span>
          <strong>{total}</strong>
          <small>All matching spins</small>
        </div>

        <div className="admin-summary-card">
          <span>Pending</span>
          <strong>{summary.pending}</strong>
          <small>Pending on this page</small>
        </div>

        <div className="admin-summary-card">
          <span>Claimed</span>
          <strong>{summary.claimed}</strong>
          <small>Claimed on this page</small>
        </div>

        <div className="admin-summary-card">
          <span>Special Rewards</span>
          <strong>{summary.special}</strong>
          <small>Special rewards on this page</small>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-filter-bar">
          <form className="admin-search-form" onSubmit={handleSearch}>
            <div className="admin-search-field">
              <span>⌕</span>

              <input
                type="search"
                placeholder="Search customer, mobile or reward"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(event.target.value)
                }
              />
            </div>

            <button
              type="submit"
              className="admin-button admin-button-primary"
            >
              Search
            </button>
          </form>

          <div className="admin-filter-controls">
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
                setMessage("");
              }}
            >
              {claimStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={rewardType}
              onChange={(event) => {
                setPage(1);
                setRewardType(event.target.value);
                setMessage("");
              }}
            >
              {rewardTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="admin-button admin-button-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-state">
            <div className="admin-loader" />
            <h3>Loading spin results</h3>
            <p>Please wait while the reward history is loaded.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="admin-state">
            <h3>No spin results found</h3>
            <p>No results match the selected filters.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-scroll">
              <table className="admin-table admin-spin-table">
                <thead>
                  <tr>
                    <th>Spin</th>
                    <th>Customer</th>
                    <th>Reward</th>
                    <th>Pool</th>
                    <th>Cycle Position</th>
                    <th>Claim Status</th>
                    <th>Spin Time</th>
                    <th>Claimed At</th>
                    <th>Redeemed At</th>
                    <th>Update Status</th>
                  </tr>
                </thead>

                <tbody>
                  {results.map((result) => (
                    <tr key={result.id}>
                      <td>
                        <div className="admin-primary-cell">
                          <strong>#{result.spinNumber}</strong>
                          <span>Result ID: {result.id}</span>
                        </div>
                      </td>

                      <td>
                        <div className="admin-primary-cell">
                          <strong>{result.customerName || "-"}</strong>
                          <span>{result.mobileNumber || "-"}</span>
                          <small>{result.city || "-"}</small>
                        </div>
                      </td>

                      <td>
                        <div className="admin-reward-cell">
                          <strong>{result.rewardLabel || "-"}</strong>

                          <span>
                            {result.rewardType === "discount" &&
                            result.discountPercent
                              ? `${result.discountPercent}% discount`
                              : result.rewardType?.replace(/_/g, " ") ||
                                "-"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-status-badge ${
                            result.selectionPool === "special"
                              ? "admin-status-warning"
                              : "admin-status-neutral"
                          }`}
                        >
                          {result.selectionPool || "-"}
                        </span>
                      </td>

                      <td>{result.cyclePosition || "-"}</td>

                      <td>
                        <span
                          className={`admin-status-badge admin-claim-${result.claimStatus}`}
                        >
                          {result.claimStatus?.replace(/_/g, " ") ||
                            "-"}
                        </span>
                      </td>

                      <td>{formatDateTime(result.createdAt)}</td>
                      <td>{formatDateTime(result.claimedAt)}</td>
                      <td>{formatDateTime(result.redeemedAt)}</td>

                      <td>
                        {result.rewardType === "no_win" ? (
                          <span className="admin-muted-text">
                            Not applicable
                          </span>
                        ) : (
                          <select
                            className="admin-status-select"
                            value={result.claimStatus || "pending"}
                            disabled={updatingId === result.id}
                            onChange={(event) =>
                              updateClaimStatus(
                                result.id,
                                event.target.value
                              )
                            }
                          >
                            <option value="pending">Pending</option>
                            <option value="claimed">Claimed</option>
                            <option value="redeemed">Redeemed</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pagination">
              <button
                type="button"
                className="admin-button admin-button-secondary"
                disabled={page <= 1}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.max(currentPage - 1, 1)
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                className="admin-button admin-button-secondary"
                disabled={page >= totalPages}
                onClick={() =>
                  setPage((currentPage) =>
                    Math.min(currentPage + 1, totalPages)
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}