import axios from 'axios';

export const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1',
});

export const projectApi = axios.create({
  baseURL: import.meta.env.VITE_PROJECT_API_BASE_URL ?? 'http://localhost:8002/api/v1',
});

export const feedbackApi = axios.create({
  baseURL: import.meta.env.VITE_FEEDBACK_API_BASE_URL ?? 'http://localhost:8003/api/v1',
});

export const documentApi = axios.create({
  baseURL: import.meta.env.VITE_DOCUMENT_API_BASE_URL ?? 'http://localhost:8004/api/v1',
});

export const analyticsApi = axios.create({
  baseURL: import.meta.env.VITE_ANALYTICS_API_BASE_URL ?? 'http://localhost:8005/api/v1',
});

export const notificationApi = axios.create({
  baseURL: import.meta.env.VITE_NOTIFICATION_API_BASE_URL ?? 'http://localhost:8006/api/v1',
});

export const auditApi = axios.create({
  baseURL: import.meta.env.VITE_AUDIT_API_BASE_URL ?? 'http://localhost:8007/api/v1',
});

export const predictionApi = axios.create({
  baseURL: import.meta.env.VITE_PREDICTION_API_BASE_URL ?? 'http://localhost:8008/api/v1',
});

const addAuthInterceptor = (instance: any) => {
  instance.interceptors.request.use((config: any) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
};

addAuthInterceptor(authApi);
addAuthInterceptor(projectApi);
addAuthInterceptor(feedbackApi);
addAuthInterceptor(documentApi);
addAuthInterceptor(analyticsApi);
addAuthInterceptor(notificationApi);
addAuthInterceptor(auditApi);
addAuthInterceptor(predictionApi);

export default authApi;
