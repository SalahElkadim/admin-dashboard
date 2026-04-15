import axios from "axios";

const ERP_BASE_URL = process.env.REACT_APP_API_URL + "/api";

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

const erpAxiosInstance = axios.create({
  baseURL: ERP_BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

erpAxiosInstance.interceptors.request.use(
  (config) => {
    const { accessToken } = getTokens();
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error) => Promise.reject(error)
);

erpAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (original.url?.includes("/auth/token/refresh/")) {
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { refreshToken } = getTokens();

        if (!refreshToken) {
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const { data } = await axios.post(
          `${ERP_BASE_URL}/store/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        updateAccessToken(data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return erpAxiosInstance(original);
      } catch (refreshError) {
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default erpAxiosInstance;
