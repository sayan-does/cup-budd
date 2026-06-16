interface SkeletonCardProps {
  width?: string;
  height?: string;
  className?: string;
}

function SkeletonCard({ width, height, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`animate-pulse bg-surface-variant brutalist-border ${className}`}
      style={{ width, height }}
    />
  );
}

export default SkeletonCard;
