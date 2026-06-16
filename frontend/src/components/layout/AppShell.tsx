import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background md:flex md:justify-center">
      <div className="relative mx-auto min-h-dvh w-full max-w-container-max-width border-x-2 border-black bg-surface pb-row-min-height">
        {children}
      </div>
    </div>
  );
}

export default AppShell;
