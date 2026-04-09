import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { configureClient, useSessionStore } from '@uber_fe/shared';
import './index.css';

configureClient({
  getToken: () => useSessionStore.getState().accessToken,
  onUnauthorized: () => useSessionStore.getState().clearSession(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
