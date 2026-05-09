/**
 * API Utility
 *
 * Provides a consistent way to make authenticated API requests
 */

import axios from "axios";

// API base URL from environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Creates an axios instance with authentication headers
 * @returns {Object} Configured axios instance
 */
export const createAuthenticatedApi = () => {
  const token = localStorage.getItem("accessToken");

  return axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};

/**
 * Make a GET request with authentication
 * @param {string} url - The API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} API response
 */
export const authGet = async (url, config = {}) => {
  const api = createAuthenticatedApi();
  return api.get(url, config);
};

/**
 * Make a POST request with authentication
 * @param {string} url - The API endpoint
 * @param {Object} data - The request body
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} API response
 */
export const authPost = async (url, data = {}, config = {}) => {
  const api = createAuthenticatedApi();
  return api.post(url, data, config);
};

/**
 * Make a PUT request with authentication
 * @param {string} url - The API endpoint
 * @param {Object} data - The request body
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} API response
 */
export const authPut = async (url, data = {}, config = {}) => {
  const api = createAuthenticatedApi();
  return api.put(url, data, config);
};

/**
 * Make a DELETE request with authentication
 * @param {string} url - The API endpoint
 * @param {Object} config - Additional axios config
 * @returns {Promise<Object>} API response
 */
export const authDelete = async (url, config = {}) => {
  const api = createAuthenticatedApi();
  return api.delete(url, config);
};

export default {
  authGet,
  authPost,
  authPut,
  authDelete,
  API_URL,
};
