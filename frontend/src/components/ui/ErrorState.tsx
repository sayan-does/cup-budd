interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <p className="text-body-md text-on-surface mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-touch-target px-6 bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
