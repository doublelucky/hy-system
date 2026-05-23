import { createHashRouter, Navigate } from 'react-router-dom';
import AuthGuard from '../components/AuthGuard';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/login';
import Dashboard from '../pages/dashboard';
import DeviceList from '../pages/device';
import DeviceDetail from '../pages/device/detail';
import VersionManagement from '../pages/version';
import FirmwareManagement from '../pages/firmware';
import MediaManagement from '../pages/media';

export const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'device',
        element: <DeviceList />,
      },
      {
        path: 'device/:id',
        element: <DeviceDetail />,
      },
      {
        path: 'version',
        element: <VersionManagement />,
      },
      {
        path: 'firmware',
        element: <FirmwareManagement />,
      },
      {
        path: 'media',
        element: <MediaManagement />,
      },
    ],
  },
]);
