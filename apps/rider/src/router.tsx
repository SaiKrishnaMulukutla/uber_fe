import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@uber_fe/shared';
import { AppShell } from '@uber_fe/ui';
import { lazy, Suspense } from 'react';
import { Spinner } from '@uber_fe/ui';

const Register = lazy(() => import('./routes/auth/register'));
const Login = lazy(() => import('./routes/auth/login'));
const VerifyOTP = lazy(() => import('./routes/auth/verify-otp'));
const Home = lazy(() => import('./routes/home'));
const Tracking = lazy(() => import('./routes/trip/tracking'));
const TripSummary = lazy(() => import('./routes/trip/summary'));
const TripHistory = lazy(() => import('./routes/trip/history'));
const Checkout = lazy(() => import('./routes/payment/checkout'));
const Notifications = lazy(() => import('./routes/notifications'));
const Profile = lazy(() => import('./routes/profile'));

const nav = [
  { to: '/', label: 'Home' },
  { to: '/trip/history', label: 'Trips' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/profile', label: 'Profile' },
];

function Wrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="flex justify-center p-8"><Spinner /></div>}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/auth',
    children: [
      { path: 'register', element: <Wrap><Register /></Wrap> },
      { path: 'login', element: <Wrap><Login /></Wrap> },
      { path: 'verify-otp', element: <Wrap><VerifyOTP /></Wrap> },
    ],
  },
  {
    path: '/',
    element: (
      <RequireAuth role="rider">
        <AppShell appName="Uber" navLinks={nav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Wrap><Home /></Wrap> },
      { path: 'trip/tracking/:tripId', element: <Wrap><Tracking /></Wrap> },
      { path: 'trip/summary/:tripId', element: <Wrap><TripSummary /></Wrap> },
      { path: 'trip/history', element: <Wrap><TripHistory /></Wrap> },
      { path: 'payment/checkout/:tripId', element: <Wrap><Checkout /></Wrap> },
      { path: 'notifications', element: <Wrap><Notifications /></Wrap> },
      { path: 'profile', element: <Wrap><Profile /></Wrap> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
