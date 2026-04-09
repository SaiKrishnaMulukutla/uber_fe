import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@uber_fe/shared';
import { AppShell } from '@uber_fe/ui';
import { lazy, Suspense } from 'react';
import { Spinner } from '@uber_fe/ui';

const Register = lazy(() => import('./routes/auth/register'));
const Login = lazy(() => import('./routes/auth/login'));
const VerifyOTP = lazy(() => import('./routes/auth/verify-otp'));
const Home = lazy(() => import('./routes/home'));
const ActiveTrip = lazy(() => import('./routes/trip/active'));
const TripHistory = lazy(() => import('./routes/trip/history'));
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
      <RequireAuth role="driver">
        <AppShell appName="Uber Driver" navLinks={nav} />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Wrap><Home /></Wrap> },
      { path: 'trip/active/:tripId', element: <Wrap><ActiveTrip /></Wrap> },
      { path: 'trip/history', element: <Wrap><TripHistory /></Wrap> },
      { path: 'notifications', element: <Wrap><Notifications /></Wrap> },
      { path: 'profile', element: <Wrap><Profile /></Wrap> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
