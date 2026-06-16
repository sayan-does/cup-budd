import { useState } from 'react';

interface EmailStepProps {
  email: string;
  onChange: (email: string) => void;
  onNext: () => void;
}

function EmailStep({ email, onChange, onNext }: EmailStepProps) {
  const [error, setError] = useState<string | null>(null);

  const validate = (value: string): boolean => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) {
      setError('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email');
      return false;
    }
    setError(null);
    return true;
  };

  const handleContinue = () => {
    if (validate(email)) {
      onChange(email.trim().toLowerCase());
      onNext();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center px-6 py-12">
      <h1 className="font-headline-lg text-on-surface mb-2 uppercase tracking-tight">Stay in the loop</h1>
      <p className="text-body-md text-on-surface opacity-60 mb-8">
        Enter your email to get match alerts for your team.
      </p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
        className="w-full h-12 px-4 brutalist-border bg-surface-variant text-base focus:outline-none focus:border-primary font-body-md mb-1"
        autoFocus
      />
      {error && <p className="text-sm text-live-red mb-4">{error}</p>}

      <button
        onClick={handleContinue}
        disabled={!email.trim()}
        className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
      >
        Continue
      </button>
    </div>
  );
}

export default EmailStep;
