// utils/apiUtils.js
const API_BASE_URL = 'http://localhost:8000';
import { getToken, clearAuth } from './auth';

// Helper untuk membuat request dengan token
export const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  // Debug logging for 401 issues
  if (!token) {
    console.warn('[apiRequest] No token found for:', endpoint);
  } else {
    console.log('[apiRequest] Token exists for:', endpoint, 'Length:', token.length);
  }
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Jika token expired atau invalid, redirect ke login
    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    // Jika response tidak OK, throw error dengan detail
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle validation errors (422)
      if (response.status === 422 && errorData.detail) {
        // FastAPI validation error format
        if (Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail.map(err => {
            const field = err.loc ? err.loc.join('.') : 'unknown';
            return `${field}: ${err.msg}`;
          }).join('; ');
          throw new Error(`Validation error: ${errorMessages}`);
        }
        // String error detail
        throw new Error(errorData.detail);
      }
      
      // Other errors
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Helper khusus untuk GET request
export const apiGet = async (endpoint) => {
  const response = await apiRequest(endpoint, { method: 'GET' });
  return response.json();
};

// Helper khusus untuk POST request
export const apiPost = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

// Helper khusus untuk PUT request
export const apiPut = async (endpoint, data) => {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

// Helper khusus untuk DELETE request
export const apiDelete = async (endpoint) => {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  return response.json();
};

// Helper khusus untuk upload file (FormData)
export const apiUpload = async (endpoint, formData, method = 'POST') => {
  const token = getToken();
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // JANGAN set Content-Type untuk FormData, browser akan set otomatis dengan boundary

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: formData,
    });

    if (response.status === 401) {
      clearAuth();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('API Upload Error:', error);
    throw error;
  }
};

// ==================== INFORMASI API ====================

// Get informasi list untuk admin dengan pagination & filter
export const getInformasiListAdmin = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.per_page) queryParams.append('per_page', params.per_page);
  if (params.is_active !== undefined) queryParams.append('is_active', params.is_active);
  if (params.target_role) queryParams.append('target_role', params.target_role);
  if (params.search) queryParams.append('search', params.search);
  
  const queryString = queryParams.toString();
  const endpoint = `/api/informasi/admin/list${queryString ? `?${queryString}` : ''}`;
  
  return apiGet(endpoint);
};

// Get informasi by ID (admin)
export const getInformasiByIdAdmin = async (id) => {
  return apiGet(`/api/informasi/admin/${id}`);
};

// Create informasi
export const createInformasi = async (data) => {
  return apiPost('/api/informasi/', data);
};

// Update informasi
export const updateInformasi = async (id, data) => {
  return apiPut(`/api/informasi/${id}`, data);
};

// Delete informasi
export const deleteInformasi = async (id) => {
  const response = await apiRequest(`/api/informasi/${id}`, { method: 'DELETE' });
  return response.ok;
};

// Upload gambar informasi
export const uploadInformasiImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiUpload('/api/informasi/upload-gambar', formData);
};

// Get informasi list untuk mobile app
export const getInformasiListMobile = async (limit = 20) => {
  return apiGet(`/api/informasi/mobile/list?limit=${limit}`);
};

// Get informasi detail untuk mobile app
export const getInformasiDetailMobile = async (id) => {
  return apiGet(`/api/informasi/mobile/${id}`);
};

// Export API_BASE_URL jika dibutuhkan
export { API_BASE_URL };