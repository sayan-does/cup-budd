interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="font-headline-lg text-on-surface mb-2 uppercase">{title}</h3>
      <p className="text-body-md text-on-surface opacity-60 mb-6">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-touch-target px-6 bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
