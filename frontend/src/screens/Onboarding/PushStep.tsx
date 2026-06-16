import { usePushSubscription } from '../../hooks/usePushSubscription';

interface PushStepProps {
  onSubscriptionReady: (sub: PushSubscription) => void;
  onSkip: () => void;
}

function PushStep({ onSubscriptionReady, onSkip }: PushStepProps) {
  const { subscribe, subscription, loading } = usePushSubscription();

  const handleEnable = async () => {
    const sub = await subscribe();
    if (sub) {
      onSubscriptionReady(sub);
      onSkip();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center p-6 text-center">
      <span className="mb-4 inline-block">
        <span className="material-symbols-outlined text-[64px] text-on-surface">notifications_active</span>
      </span>
      <p className="font-headline-lg text-on-surface mb-2 uppercase">Match alerts</p>
      <p className="text-body-md text-on-surface opacity-60 mb-6">
        Get notified when your team scores and when matches start.
      </p>

      {subscription ? (
        <p className="text-sm text-green-700 mb-4">Notifications are enabled</p>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase text-lg mb-2 disabled:opacity-50 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          {loading ? 'Enabling...' : 'Enable notifications'}
        </button>
      )}

      <button onClick={onSkip} className="text-sm text-on-surface opacity-60 underline font-medium">
        {subscription ? 'Continue' : 'Skip for now'}
      </button>
    </div>
  );
}

export default PushStep;
