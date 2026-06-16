import { Navigate, Outlet } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import type { ReactNode } from 'react';

function GuardedRoute() {
  const email = useUserStore((s) => s.email);

  if (!email) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export function RequireNotOnboarded({ children }: { children: ReactNode }) {
  const onboardingComplete = useUserStore((s) => s.onboardingComplete);
  return onboardingComplete ? <Navigate to="/" replace /> : <>{children}</>;
}

export default GuardedRoute;
