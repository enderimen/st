import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:5155/api', /* process.env.VUE_APP_API_URL */
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

http.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config
});

http.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL}/Auth/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          localStorage.setItem('token', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return http(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.reload();
          return Promise.reject(refreshErr);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default http;