interface StepIndicatorProps {
  steps: number;
  currentStep: number;
}

function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-center gap-2 py-6">
      {Array.from({ length: steps }, (_, i) => (
        <div
          key={i}
          className={`border-2 border-black transition-colors ${
            i === currentStep
              ? 'bg-primary w-5 h-5'
              : i < currentStep
                ? 'bg-black w-4 h-4'
                : 'bg-white w-4 h-4'
          }`}
        />
      ))}
    </div>
  );
}

export default StepIndicator;
