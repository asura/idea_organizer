import axios from 'axios';

const PERF_ENABLED = import.meta.env.VITE_PERF_LOGGING === 'true';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

if (PERF_ENABLED) {
  api.interceptors.request.use((config) => {
    (config as unknown as Record<string, unknown>).__startTime = performance.now();
    return config;
  });

  api.interceptors.response.use((response) => {
    const start = (response.config as unknown as Record<string, unknown>).__startTime as number;
    if (start) {
      const totalMs = performance.now() - start;
      const serverMs = response.headers['x-response-time-ms'];
      console.log(
        `[PERF:API] ${response.config.method?.toUpperCase()} ${response.config.url} ` +
        `total=${totalMs.toFixed(1)}ms server=${serverMs || '?'}ms`
      );
    }
    return response;
  });
}
