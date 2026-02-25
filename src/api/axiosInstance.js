import axios from "axios";

const BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/dashboard";

const getTokens = () => {
  const state = JSON.parse(localStorage.getItem("auth-storage"))?.state;
  return {
    accessToken: state?.accessToken,
    refreshToken: state?.refreshToken,
  };
};

const updateAccessToken = (newToken) => {
  const storage = JSON.parse(localStorage.getItem("auth-storage"));
  if (storage?.state) {
    storage.state.accessToken = newToken;
    localStorage.setItem("auth-storage", JSON.stringify(storage));
  }
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = getTokens();
        const { data } = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        updateAccessToken(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return axiosInstance(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
