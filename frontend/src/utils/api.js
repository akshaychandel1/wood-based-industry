import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api"; // Matches your backend setup

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Allows cookies and sessions
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include Authorization header with token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Generic function to handle API requests
const fetchData = async (endpoint, errorMessage, params = {}, config = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    console.log(`🔄 Fetching: ${url.toString()}`); // Debugging
    const response = await api.get(endpoint, { params, ...config });
    console.log(`✅ Response from ${endpoint}:`, response.data); // Debugging
    return response.data;
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error.response?.data || error.message);
    return []; // Prevent crashes on frontend
  }
};

// Authentication APIs (Matches backend `authRoutes.js`)
export const loginUser = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Login failed";
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Registration failed";
  }
};

export const fetchCaptcha = async () => {
  try {
    const response = await api.get("/auth/captcha");
    return response.data;
  } catch (error) {
    return null;
  }
};

// Forgot Password API (Matches backend `forgotRoutes.js`)
export const requestPasswordReset = async (email) => {
  try {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || "Password reset request failed";
  }
};

export const resetPassword = async (data) => {
  try {
    const response = await api.post("/auth/reset-password", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || "Password reset failed";
  }
};

// Notifications APIs
export const fetchNotifications = () => fetchData("/notifications", "Error fetching notifications");

export const addNotification = async (formData) => {
  try {
    const response = await api.post("/notifications", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(`✅ Response from /notifications (POST):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error adding notification:", error.response?.data || error.message);
    throw error.response?.data || "Error adding notification";
  }
};

export const updateNotification = async (id, data) => {
  try {
    const response = await api.put(`/notifications/${id}`, data);
    console.log(`✅ Response from /notifications/${id} (PUT):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating notification:", error.response?.data || error.message);
    throw error.response?.data || "Error updating notification";
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/notifications/${id}`);
    console.log(`✅ Response from /notifications/${id} (DELETE):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting notification:", error.response?.data || error.message);
    throw error.response?.data || "Error deleting notification";
  }
};

// Tree Census APIs
export const fetchTreeCensus = () => fetchData("/treeCensus", "Error fetching tree census data");

export const addTreeCensus = async (formData) => {
  try {
    const response = await api.post("/treeCensus", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(`✅ Response from /treeCensus (POST):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error adding tree census record:", error.response?.data || error.message);
    throw error.response?.data || "Error adding tree census record";
  }
};

export const updateTreeCensus = async (id, data) => {
  try {
    const response = await api.put(`/treeCensus/${id}`, data);
    console.log(`✅ Response from /treeCensus/${id} (PUT):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating tree census record:", error.response?.data || error.message);
    throw error.response?.data || "Error updating tree census record";
  }
};

export const deleteTreeCensus = async (id) => {
  try {
    const response = await api.delete(`/treeCensus/${id}`);
    console.log(`✅ Response from /treeCensus/${id} (DELETE):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting tree census record:", error.response?.data || error.message);
    throw error.response?.data || "Error deleting tree census record";
  }
};

// Instructions APIs
export const fetchInstructions = () => fetchData("/instructions", "Error fetching instructions");

export const addInstruction = async (formData) => {
  try {
    const response = await api.post("/instructions", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(`✅ Response from /instructions (POST):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error adding instruction:", error.response?.data || error.message);
    throw error.response?.data || "Error adding instruction";
  }
};

export const updateInstruction = async (id, formData) => {
  try {
    const response = await api.put(`/instructions/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(`✅ Response from /instructions/${id} (PUT):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error updating instruction:", error.response?.data || error.message);
    throw error.response?.data || "Error updating instruction";
  }
};

export const deleteInstruction = async (id) => {
  try {
    const response = await api.delete(`/instructions/${id}`);
    console.log(`✅ Response from /instructions/${id} (DELETE):`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error deleting instruction:", error.response?.data || error.message);
    throw error.response?.data || "Error deleting instruction";
  }
};

// Punjab Dashboard APIs (Matches `dashboardRoutes.js`)
export const fetchPunjabTotalUnits = () => fetchData("/dashboard/total-units", "Error fetching Punjab total units");

export const fetchPunjabDistrictCategory = (params = {}) =>
  fetchData("/dashboard/district-category", "Error fetching Punjab district category", params);

export const fetchPunjabDistrictCategoryDetails = (params = {}) =>
  fetchData("/dashboard/district-category-details", "Error fetching Punjab district category details", params);

export const fetchPunjabUnitCategories = () => fetchData("/dashboard/unit-categories", "Error fetching Punjab unit categories");
export const fetchPunjabLicenseStatus = () => fetchData("/dashboard/license-status", "Error fetching Punjab license status");
export const fetchPunjabOwnershipChanges = (params = {}) =>
  fetchData("/dashboard/ownership-changes", "Error fetching Punjab ownership changes", params);
export const fetchPunjabTransferredUnits = () => fetchData("/dashboard/transferred-units", "Error fetching Punjab transferred units");
export const fetchPunjabEcoSensitiveUnits = () => fetchData("/dashboard/eco-sensitive-units", "Error fetching Punjab eco-sensitive units");
export const fetchPunjabNewApplications = (params = {}) => {
  const endpoint = params.detailed ? "/dashboard/new-applications/details" : "/dashboard/new-applications/aggregate";
  return fetchData(endpoint, "Error fetching Punjab new applications", params);
};
export const fetchPunjabFilterOptions = () =>
  fetchData("/dashboard/new-applications/filters", "Error fetching Punjab filter options");
export const fetchPunjabApplicationActions = () =>
  fetchData("/dashboard/application-actions", "Error fetching Punjab application actions");
export const fetchPunjabLicensesByYear = () => fetchData("/dashboard/licenses-by-year", "Error fetching Punjab licenses by year");
export const fetchPunjabPendingApprovedApplications = () =>
  fetchData("/dashboard/pending-approved-applications", "Error fetching Punjab pending vs. approved applications");

export const fetchPunjabDashboardData = async ({ service_type, status, pending_stage } = {}) => {
  try {
    const response = await api.get("/dashboard/getDashboardData", {
      params: { service_type, status, pending_stage },
    });
    console.log(`✅ Response from /dashboard/getDashboardData:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching Punjab dashboard data:", error.response?.data || error.message);
    return [];
  }
};

export const fetchPunjabApplicationsByDistrict = async (district, service_type, status, { search, pending_stage } = {}) => {
  try {
    const response = await api.get("/dashboard/getApplicationsByDistrict", {
      params: { district, service_type, status, search, pending_stage },
    });
    console.log(`✅ Response from /dashboard/getApplicationsByDistrict:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching Punjab applications by district:", error.response?.data || error.message);
    return [];
  }
};

// Haryana Dashboard APIs (Matches `haryanaRoutes.js`)
export const fetchHaryanaTotalUnits = () => fetchData("/haryana/total-units", "Error fetching Haryana total units");

export const fetchHaryanaDistrictCategory = (params = {}) =>
  fetchData("/haryana/district-category", "Error fetching Haryana district category", params);

export const fetchHaryanaDistrictCategoryDetails = (params = {}) =>
  fetchData("/haryana/district-category-details", "Error fetching Haryana district category details", params);

export const fetchHaryanaUnitCategories = () => fetchData("/haryana/unit-categories", "Error fetching Haryana unit categories");
export const fetchHaryanaLicenseStatus = () => fetchData("/haryana/license-status", "Error fetching Haryana license status");
export const fetchHaryanaOwnershipChanges = (params = {}) =>
  fetchData("/haryana/ownership-changes", "Error fetching Haryana ownership changes", params);
export const fetchHaryanaTransferredUnits = () => fetchData("/haryana/transferred-units", "Error fetching Haryana transferred units");
export const fetchHaryanaEcoSensitiveUnits = () => fetchData("/haryana/eco-sensitive-units", "Error fetching Haryana eco-sensitive units");
export const fetchHaryanaNewApplications = (params = {}) => {
  const endpoint = params.detailed ? "/haryana/new-applications/details" : "/haryana/new-applications/aggregate";
  return fetchData(endpoint, "Error fetching Haryana new applications", params);
};
export const fetchHaryanaFilterOptions = () =>
  fetchData("/haryana/new-applications/filters", "Error fetching Haryana filter options");
export const fetchHaryanaApplicationActions = () =>
  fetchData("/haryana/application-actions", "Error fetching Haryana application actions");
export const fetchHaryanaLicensesByYear = () => fetchData("/haryana/licenses-by-year", "Error fetching Haryana licenses by year");
export const fetchHaryanaPendingApprovedApplications = () =>
  fetchData("/haryana/pending-approved-applications", "Error fetching Haryana pending vs. approved applications");

export const fetchHaryanaDashboardData = async ({ service_type, status, pending_stage } = {}) => {
  try {
    const response = await api.get("/haryana/getDashboardData", {
      params: { service_type, status, pending_stage },
    });
    console.log(`✅ Response from /haryana/getDashboardData:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching Haryana dashboard data:", error.response?.data || error.message);
    return [];
  }
};

export const fetchHaryanaApplicationsByDistrict = async (district, service_type, status, { search, pending_stage } = {}) => {
  try {
    const response = await api.get("/haryana/getApplicationsByDistrict", {
      params: { district, service_type, status, search, pending_stage },
    });
    console.log(`✅ Response from /haryana/getApplicationsByDistrict:`, response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching Haryana applications by district:", error.response?.data || error.message);
    return [];
  }
};

// Export API instance for manual calls if needed
export default api;