import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

const client = axios.create({ baseURL });

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('tokens') || 'null');
  } catch {
    return null;
  }
}

function setTokens(tokens) {
  if (tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens));
  } else {
    localStorage.removeItem('tokens');
  }
}

client.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

let refreshPromise = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401 && !config._retry && !config.url.includes('/auth/')) {
      const tokens = getTokens();
      if (!tokens?.refreshToken) {
        setTokens(null);
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(error);
      }

      config._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${baseURL}/auth/refresh`, { refreshToken: tokens.refreshToken })
            .then((res) => res.data.data)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const newTokens = await refreshPromise;
        setTokens(newTokens);
        config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return client(config);
      } catch (refreshError) {
        setTokens(null);
        window.dispatchEvent(new Event('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = 'Something went wrong') {
  return error?.response?.data?.error?.message || error?.message || fallback;
}

export { getTokens, setTokens };
export default client;
