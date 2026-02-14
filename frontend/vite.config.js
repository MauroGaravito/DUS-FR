import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const allowedHosts = ['field-report.downundersolutions.com'];

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts
  }
});
