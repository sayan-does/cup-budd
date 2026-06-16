import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import GuardedRoute, { RequireNotOnboarded } from './components/GuardedRoute';

// Wrap dynamic imports so a failed import shows a user-friendly error component
const safeImport = (loader: () => Promise<any>) =>
  loader().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Dynamic import failed', err);
    return {
      default: () => (
        <div className="min-h-[60dvh] flex items-center justify-center p-6">
          <div className="text-center">
            <p className="font-bold text-lg">Failed to load module</p>
            <p className="text-sm opacity-60">Check the dev server console and reload the page.</p>
          </div>
        </div>
      ),
    };
  });

const Onboarding = lazy(() => safeImport(() => import('./screens/Onboarding')));
const Home = lazy(() => safeImport(() => import('./screens/Home')));
const Match = lazy(() => safeImport(() => import('./screens/Match')));
const Profile = lazy(() => safeImport(() => import('./screens/Profile')));
// Matches is imported directly to avoid intermittent dev-server HMR 404s for this route.
import Matches from './screens/Matches';
const Table = lazy(() => safeImport(() => import('./screens/Table')));

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-white flex items-center justify-center">
          <div className="space-y-4 w-64">
            <div className="animate-pulse bg-surface-variant brutalist-border h-24" />
            <div className="animate-pulse bg-surface-variant brutalist-border h-6" />
            <div className="animate-pulse bg-surface-variant brutalist-border h-6" />
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/onboarding" element={<RequireNotOnboarded><Onboarding /></RequireNotOnboarded>} />
        <Route element={<GuardedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/match/:id" element={<Match />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/table" element={<Table />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
