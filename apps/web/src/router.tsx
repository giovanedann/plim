import { AppLayout } from '@/components/layouts/app'
import { AuthLayout } from '@/components/layouts/auth'
import { AuthCallbackPage, DashboardPage, SignInPage, SignUpPage } from '@/pages'
import { Navigate, createBrowserRouter } from 'react-router'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/sign-in" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
])
