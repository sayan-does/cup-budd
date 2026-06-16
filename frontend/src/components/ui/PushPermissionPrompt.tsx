import { usePushSubscription } from '../../hooks/usePushSubscription';

interface PushPermissionPromptProps {
  onPermissionGranted?: () => void;
  onSkip: () => void;
}

function PushPermissionPrompt({ onPermissionGranted, onSkip }: PushPermissionPromptProps) {
  const { subscribe, permissionState, loading, error } = usePushSubscription();

  const handleEnable = async () => {
    await subscribe();
    if (permissionState === 'granted') {
      onPermissionGranted?.();
    }
  };

  return (
    <div className="p-6 text-center">
      <span className="material-symbols-outlined text-[64px] text-on-surface mb-4 inline-block">notifications_active</span>
      <p className="font-headline-lg text-on-surface mb-2 uppercase">Match alerts</p>
      <p className="text-body-md text-on-surface opacity-60 mb-6">
        Get notified when your team scores and when matches start.
      </p>

      {permissionState === 'denied' && (
        <div className="mb-4 p-3 bg-live-red/10 brutalist-border">
          <p className="text-sm text-live-red font-bold uppercase">
            Notifications are blocked. Please enable them in your browser settings.
          </p>
        </div>
      )}

      {permissionState === 'granted' ? (
        <p className="text-sm text-green-700 mb-4">Notifications are enabled</p>
      ) : (
        <button
          onClick={handleEnable}
          disabled={loading}
          className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase mb-2 disabled:opacity-50 hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all"
        >
          {loading ? 'Enabling...' : 'Enable notifications'}
        </button>
      )}

      {error && <p className="text-sm text-live-red mb-4">{error}</p>}

      <button
        onClick={onSkip}
        className="text-sm text-on-surface opacity-60 underline font-medium"
      >
        {permissionState === 'granted' ? 'Continue' : 'Skip for now'}
      </button>
    </div>
  );
}

export default PushPermissionPrompt;
