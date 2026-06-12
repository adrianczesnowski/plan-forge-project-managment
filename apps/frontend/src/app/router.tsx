import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';
import { SpacePage } from '@/pages/space/SpacePage';
import { ProjectPage } from '@/pages/project/ProjectPage';
import { AppLayout } from './layouts/AppLayout';
import { GuestRoute } from './guards/GuestRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RequireOrganization } from './guards/RequireOrganization';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      // OnboardingPage redirects back to "/" when the user already has an organization.
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <RequireOrganization />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/spaces/:spaceId', element: <SpacePage /> },
              { path: '/projects/:projectId', element: <ProjectPage /> },
              // Deep link to the task modal rendered on top of the project view.
              { path: '/projects/:projectId/tasks/:taskId', element: <ProjectPage /> },
            ],
          },
        ],
      },
    ],
  },
]);
