import type { ReactNode } from 'react';

interface DataTableProps {
  children: ReactNode;
  className?: string;
}

function DataTable({ children, className = '' }: DataTableProps) {
  return (
    <div className={`bg-surface brutalist-border divide-y-2 divide-black ${className}`}>
      {children}
    </div>
  );
}

export default DataTable;
