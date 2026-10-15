const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Register a new user
 */
export async function signupUser({ name, email, password }) {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Signup failed');
  }
  return data;
}

/**
 * Authenticate existing user
 */
export async function loginUser({ email, password }) {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }
  return data;
}

/**
 * Fetch authenticated user profile
 */
export async function fetchCurrentUser(token) {
  const response = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch user');
  }
  return data;
}

/**
 * Fetch user order history
 */
export async function fetchMyOrders(token) {
  const response = await fetch(`${BASE_URL}/api/orders/my-orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch orders');
  }
  return data;
}

/**
 * Fetch all products or filter by search query
 */
export async function fetchProducts(search = '') {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
  const response = await fetch(`${BASE_URL}/api/products${query}`);
  if (!response.ok) {
    throw new Error(`Failed to load products (${response.status})`);
  }
  return response.json();
}

/**
 * Place a new customer order (supports optional auth token)
 */
export async function submitOrder(orderData, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `Failed to submit order (${response.status})`);
  }
  return data;
}

/**
 * Health check for backend API
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) return { ok: false, status: response.status };
    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
