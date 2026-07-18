const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function apiRequest(endpoint, options = {}) {
  const { timeout = 30000, ...customOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const headers = {};
  if (!(customOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const config = {
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers,
    },
    signal: controller.signal,
  };

  try {
    const url = `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const response = await fetch(url, config);
    clearTimeout(id);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw {
        status: response.status,
        message: errorData.detail || errorData.message || "API request failed",
        data: errorData,
      };
    }

    return await response.json();
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      throw { status: 408, message: "Request timed out" };
    }
    throw error;
  }
}

export async function checkBackendHealth() {
  try {
    const data = await apiRequest("/", { timeout: 5000 });
    return data && data.status === "healthy";
  } catch (e) {
    console.error("Backend health check failed:", e);
    return false;
  }
}

export async function runListingAgent(formData) {
  return await apiRequest("/api/listing/run-agent", {
    method: "POST",
    body: formData,
    timeout: 120000,
  });
}

export async function runQnaAgent(listingId, currentListing, targetLanguage) {
  return await apiRequest("/api/qna/run-agent", {
    method: "POST",
    body: JSON.stringify({
      listing_id: listingId,
      current_listing: currentListing,
      target_language: targetLanguage,
    }),
    timeout: 120000,
  });
}

export async function getWeeklyBrief(sellerId, targetLanguage, sellerName) {
  let url = `/api/health-brief/weekly-summary?seller_id=${encodeURIComponent(sellerId)}&target_language=${encodeURIComponent(targetLanguage)}`;
  if (sellerName) {
    url += `&seller_name=${encodeURIComponent(sellerName)}`;
  }
  return await apiRequest(url, {
    method: "GET",
    timeout: 30000,
  });
}

export async function applyHealthSuggestion(sellerId, action) {
  return await apiRequest("/api/health-brief/apply-suggestion", {
    method: "POST",
    body: JSON.stringify({
      seller_id: sellerId,
      action: action,
    }),
    timeout: 30000,
  });
}

export async function getPincodeRiskBatch(inputs) {
  return await apiRequest("/api/listing/pincode-risk-batch", {
    method: "POST",
    body: JSON.stringify(inputs),
    timeout: 30000,
  });
}

export async function sendAssistantMessage(message, history = [], language = "en") {
  return await apiRequest("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      history,
      language,
    }),
    timeout: 30000,
  });
}
