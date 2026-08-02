const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    credentials: 'include',
    ...options,
    headers: {
      ...options.headers,
    },
  };

  if (!(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, config);

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = { success: false, message: 'Failed to parse response' };
  }

  if (!response.ok) {
    const error = new Error(data.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  get(endpoint) {
    return request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  patch(endpoint, body) {
    return request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  },

  postForm(endpoint, formData) {
    return request(endpoint, {
      method: 'POST',
      body: formData,
    });
  },

  patchForm(endpoint, formData) {
    return request(endpoint, {
      method: 'PATCH',
      body: formData,
    });
  },
};

export default api;
