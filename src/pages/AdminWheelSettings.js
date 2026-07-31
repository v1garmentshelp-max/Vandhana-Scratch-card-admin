import React, { useEffect, useMemo, useState } from "react";
import "./AdminWheelSettings.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://vandhana-scratch-card-backend.vercel.app";

const wheelColors = [
  "#ffd60a",
  "#111111",
  "#ff9f1c",
  "#ffffff",
  "#2ec4b6",
  "#ff595e",
  "#8ac926",
  "#6a4c93"
];

const createRewardForm = (reward) => ({
  ...reward,
  rewardLabel: reward.rewardLabel || "",
  discountPercent:
    reward.discountPercent === null ||
    reward.discountPercent === undefined
      ? ""
      : String(reward.discountPercent),
  stockQuantity:
    reward.stockQuantity === null ||
    reward.stockQuantity === undefined
      ? ""
      : String(reward.stockQuantity),
  imageUrl: reward.imageUrl || "",
  selectionPool: reward.selectionPool || "normal",
  selectionWeight: String(reward.selectionWeight || 1),
  displayOrder: String(reward.displayOrder || 0),
  enabled: Boolean(reward.isActive && reward.displayOnWheel)
});

const getWheelLabel = (reward) => {
  if (reward.rewardType === "discount") {
    return `${reward.discountPercent || 0}% OFF`;
  }

  return reward.rewardLabel;
};

export default function AdminWheelSettings() {
  const [campaign, setCampaign] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    campaignName: "",
    wheelTitle: "",
    specialRewardEvery: "25",
    isActive: true
  });
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await fetch(`${API_BASE_URL}/api/admin/wheel`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load wheel settings");
      }

      setCampaign(data.campaign || null);

      setCampaignForm({
        campaignName: data.campaign?.campaignName || "",
        wheelTitle: data.campaign?.wheelTitle || "Spin & Win",
        specialRewardEvery: String(
          data.campaign?.specialRewardEvery || 25
        ),
        isActive: Boolean(data.campaign?.isActive)
      });

      setRewards(
        Array.isArray(data.rewards)
          ? data.rewards.map(createRewardForm)
          : []
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to load wheel settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const previewRewards = useMemo(
    () =>
      rewards
        .filter((reward) => reward.enabled)
        .sort(
          (firstReward, secondReward) =>
            Number(firstReward.displayOrder) -
            Number(secondReward.displayOrder)
        ),
    [rewards]
  );

  const wheelBackground = useMemo(() => {
    if (previewRewards.length === 0) {
      return "#f1f3f5";
    }

    const segmentSize = 360 / previewRewards.length;

    const segments = previewRewards.map((reward, index) => {
      const start = index * segmentSize;
      const end = start + segmentSize;
      const color = wheelColors[index % wheelColors.length];

      return `${color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${segments.join(", ")})`;
  }, [previewRewards]);

  const handleCampaignChange = (event) => {
    const { name, value } = event.target;

    setCampaignForm((current) => ({
      ...current,
      [name]: value
    }));

    setMessage("");
    setError("");
  };

  const handleRewardChange = (rewardId, field, value) => {
    setRewards((currentRewards) =>
      currentRewards.map((reward) =>
        reward.id === rewardId
          ? {
              ...reward,
              [field]: value
            }
          : reward
      )
    );

    setMessage("");
    setError("");
  };

  const validateSettings = () => {
    const specialRewardEvery = Number(campaignForm.specialRewardEvery);

    if (!campaignForm.wheelTitle.trim()) {
      throw new Error("Wheel title is required");
    }

    if (
      !Number.isInteger(specialRewardEvery) ||
      specialRewardEvery <= 0
    ) {
      throw new Error(
        "Special reward frequency must be a positive whole number"
      );
    }

    const enabledNormalRewards = rewards.filter(
      (reward) =>
        reward.enabled && reward.selectionPool === "normal"
    );

    const enabledSpecialRewards = rewards.filter(
      (reward) =>
        reward.enabled && reward.selectionPool === "special"
    );

    if (enabledNormalRewards.length === 0) {
      throw new Error("Keep at least one regular reward enabled");
    }

    if (enabledSpecialRewards.length === 0) {
      throw new Error("Keep at least one special reward enabled");
    }

    for (const reward of rewards) {
      if (!reward.rewardLabel.trim()) {
        throw new Error("Every reward must have a label");
      }

      if (reward.rewardType === "discount") {
        const discountPercent = Number(reward.discountPercent);

        if (
          !Number.isFinite(discountPercent) ||
          discountPercent <= 0 ||
          discountPercent > 100
        ) {
          throw new Error(
            `${reward.rewardLabel} must have a discount between 1 and 100`
          );
        }
      }

      if (reward.rewardType === "prize" && reward.stockQuantity !== "") {
        const stockQuantity = Number(reward.stockQuantity);

        if (
          !Number.isInteger(stockQuantity) ||
          stockQuantity < 0
        ) {
          throw new Error(
            `${reward.rewardLabel} stock must be zero or greater`
          );
        }
      }
    }
  };

  const saveSettings = async () => {
    if (!campaign || saving) {
      return;
    }

    try {
      validateSettings();

      setSaving(true);
      setMessage("");
      setError("");

      const campaignResponse = await fetch(
        `${API_BASE_URL}/api/admin/campaign/${campaign.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            campaignName:
              campaignForm.campaignName.trim() ||
              "Vandhana Spin and Win",
            wheelTitle: campaignForm.wheelTitle.trim(),
            specialRewardEvery: Number(
              campaignForm.specialRewardEvery
            ),
            isActive: true
          })
        }
      );

      const campaignData = await campaignResponse
        .json()
        .catch(() => ({}));

      if (!campaignResponse.ok) {
        throw new Error(
          campaignData.message || "Unable to update wheel settings"
        );
      }

      const updatedRewards = await Promise.all(
        rewards.map(async (reward) => {
          const response = await fetch(
            `${API_BASE_URL}/api/admin/rewards/${reward.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                rewardLabel: reward.rewardLabel.trim(),
                rewardType: reward.rewardType,
                discountPercent:
                  reward.rewardType === "discount"
                    ? Number(reward.discountPercent)
                    : null,
                imageUrl: reward.imageUrl.trim() || null,
                selectionPool: reward.selectionPool,
                selectionWeight: Number(reward.selectionWeight),
                stockQuantity:
                  reward.rewardType === "prize" &&
                  reward.stockQuantity !== ""
                    ? Number(reward.stockQuantity)
                    : null,
                isActive: reward.enabled,
                displayOnWheel: reward.enabled,
                displayOrder: Number(reward.displayOrder)
              })
            }
          );

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(
              data.message ||
                `Unable to update ${reward.rewardLabel}`
            );
          }

          return createRewardForm(data.reward);
        })
      );

      setCampaign(campaignData.campaign);

      setCampaignForm((current) => ({
        ...current,
        wheelTitle: campaignData.campaign.wheelTitle,
        specialRewardEvery: String(
          campaignData.campaign.specialRewardEvery
        ),
        isActive: Boolean(campaignData.campaign.isActive)
      }));

      setRewards(updatedRewards);

      setMessage(
        "Wheel updated successfully. The customer website will show these changes."
      );
    } catch (requestError) {
      setError(requestError.message || "Unable to save wheel settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="wheel-admin-page">
        <div className="wheel-admin-loading">
          <div className="wheel-admin-loader" />
          <h2>Loading wheel</h2>
          <p>Please wait while the rewards are loaded.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="wheel-admin-page">
      <header className="wheel-admin-header">
        <div>
          <h2>Wheel Settings</h2>
          <p>Edit the wheel and save the changes.</p>
        </div>

        <div className="wheel-admin-header-actions">
          <button
            type="button"
            className="wheel-admin-refresh-button"
            onClick={loadSettings}
            disabled={saving}
          >
            Refresh
          </button>

          <button
            type="button"
            className="wheel-admin-save-button"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {error ? (
        <div className="wheel-admin-alert wheel-admin-alert-error">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="wheel-admin-alert wheel-admin-alert-success">
          {message}
        </div>
      ) : null}

      <div className="wheel-admin-layout">
        <div className="wheel-admin-preview-card">
          <div className="wheel-admin-preview-heading">
            <span>Website Preview</span>
            <h3>{campaignForm.wheelTitle || "Spin & Win"}</h3>
          </div>

          {previewRewards.length > 0 ? (
            <div className="wheel-admin-wheel-shell">
              <div className="wheel-admin-pointer" />

              <div
                className="wheel-admin-wheel"
                style={{
                  background: wheelBackground
                }}
              >
                {previewRewards.map((reward, index) => {
                  const segmentAngle = 360 / previewRewards.length;
                  const angle =
                    index * segmentAngle + segmentAngle / 2;

                  return (
                    <div
                      key={reward.id}
                      className={`wheel-admin-segment-label ${
                        index % wheelColors.length === 1 ||
                        index % wheelColors.length === 5 ||
                        index % wheelColors.length === 7
                          ? "wheel-admin-segment-light"
                          : ""
                      }`}
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-105px) rotate(${-angle}deg)`
                      }}
                    >
                      {getWheelLabel(reward)}
                    </div>
                  );
                })}

                <div className="wheel-admin-center-button">
                  SPIN
                </div>
              </div>
            </div>
          ) : (
            <div className="wheel-admin-empty-wheel">
              Enable rewards to preview the wheel.
            </div>
          )}

          <div className="wheel-admin-preview-info">
            <span>
              Total spins
              <strong>{campaign?.totalSpins || 0}</strong>
            </span>

            <span>
              Special reward
              <strong>
                Every {campaignForm.specialRewardEvery || 25} spins
              </strong>
            </span>
          </div>
        </div>

        <div className="wheel-admin-settings">
          <div className="wheel-admin-section">
            <h3>Basic Settings</h3>

            <div className="wheel-admin-basic-grid">
              <label className="wheel-admin-field">
                <span>Wheel Title</span>
                <input
                  type="text"
                  name="wheelTitle"
                  value={campaignForm.wheelTitle}
                  onChange={handleCampaignChange}
                />
              </label>

              <label className="wheel-admin-field">
                <span>Special Reward Every</span>
                <input
                  type="number"
                  name="specialRewardEvery"
                  min="1"
                  step="1"
                  value={campaignForm.specialRewardEvery}
                  onChange={handleCampaignChange}
                />
              </label>
            </div>
          </div>

          <div className="wheel-admin-section">
            <div className="wheel-admin-section-heading">
              <div>
                <h3>Rewards</h3>
                <p>Change the values shown on the customer wheel.</p>
              </div>

              <span>{rewards.length} rewards</span>
            </div>

            <div className="wheel-admin-reward-list">
              {rewards.map((reward, index) => (
                <div
                  className="wheel-admin-reward-row"
                  key={reward.id}
                >
                  <div className="wheel-admin-reward-title">
                    <span
                      className="wheel-admin-reward-color"
                      style={{
                        background:
                          wheelColors[index % wheelColors.length]
                      }}
                    />

                    <div>
                      <strong>{reward.rewardLabel}</strong>
                      <small>
                        {reward.selectionPool === "special"
                          ? "Special reward"
                          : "Regular reward"}
                      </small>
                    </div>
                  </div>

                  <div className="wheel-admin-reward-fields">
                    <label className="wheel-admin-field">
                      <span>Label</span>
                      <input
                        type="text"
                        value={reward.rewardLabel}
                        onChange={(event) =>
                          handleRewardChange(
                            reward.id,
                            "rewardLabel",
                            event.target.value
                          )
                        }
                      />
                    </label>

                    {reward.rewardType === "discount" ? (
                      <label className="wheel-admin-field wheel-admin-small-field">
                        <span>Discount %</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.01"
                          value={reward.discountPercent}
                          onChange={(event) =>
                            handleRewardChange(
                              reward.id,
                              "discountPercent",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    ) : null}

                    {reward.rewardType === "prize" ? (
                      <label className="wheel-admin-field wheel-admin-small-field">
                        <span>Stock</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Unlimited"
                          value={reward.stockQuantity}
                          onChange={(event) =>
                            handleRewardChange(
                              reward.id,
                              "stockQuantity",
                              event.target.value
                            )
                          }
                        />
                      </label>
                    ) : null}

                    <label className="wheel-admin-field wheel-admin-pool-field">
                      <span>Reward Group</span>
                      <select
                        value={reward.selectionPool}
                        onChange={(event) =>
                          handleRewardChange(
                            reward.id,
                            "selectionPool",
                            event.target.value
                          )
                        }
                      >
                        <option value="normal">Regular</option>
                        <option value="special">Special</option>
                      </select>
                    </label>

                    <label className="wheel-admin-switch">
                      <input
                        type="checkbox"
                        checked={reward.enabled}
                        onChange={(event) =>
                          handleRewardChange(
                            reward.id,
                            "enabled",
                            event.target.checked
                          )
                        }
                      />

                      <span className="wheel-admin-switch-track">
                        <span />
                      </span>

                      <strong>
                        {reward.enabled ? "Visible" : "Hidden"}
                      </strong>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="wheel-admin-bottom-save-button"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Wheel Changes"}
          </button>
        </div>
      </div>
    </section>
  );
}