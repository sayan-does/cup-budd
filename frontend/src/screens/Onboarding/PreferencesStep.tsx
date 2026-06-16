import Toggle from '../../components/ui/Toggle';

interface PreferencesStepProps {
  preferences: {
    match_reminders: boolean;
    goal_alerts: boolean;
    result_summaries: boolean;
  };
  onChange: (prefs: Partial<PreferencesStepProps['preferences']>) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
}

function PreferencesStep({ preferences, onChange, loading, error, onSubmit }: PreferencesStepProps) {
  return (
    <div className="flex-1 flex flex-col px-6 pt-2">
      <div className="mb-8 border-4 border-black shadow-neo overflow-hidden relative h-48 bg-accent-ochre">
        <div className="w-full h-full bg-accent-ochre flex items-center justify-center">
          <span className="material-symbols-outlined text-[64px] text-black opacity-30">stadium</span>
        </div>
        <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" />
      </div>

      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface mb-3 uppercase tracking-tighter">What do you want to hear?</h1>
        <p className="text-body-md text-on-surface font-medium border-l-4 border-live-red pl-3">
          Personalize your live experience. You can change these anytime in your profile settings.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between p-4 border-2 border-black bg-white shadow-neo-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border-2 border-black bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-black">notifications</span>
            </div>
            <div>
              <p className="font-bold uppercase text-sm">Match reminders</p>
              <p className="text-xs font-medium text-on-surface opacity-60">30 minutes before kickoff</p>
            </div>
          </div>
          <Toggle
            label=""
            checked={preferences.match_reminders}
            onChange={(v) => onChange({ match_reminders: v })}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-2 border-black bg-accent-ochre/10 shadow-neo-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center">
              <span className="material-symbols-outlined text-black">sports_soccer</span>
            </div>
            <div>
              <p className="font-bold uppercase text-sm">Goal alerts</p>
              <p className="text-xs font-medium text-on-surface opacity-60">Real-time score updates</p>
            </div>
          </div>
          <Toggle
            label=""
            checked={preferences.goal_alerts}
            onChange={(v) => onChange({ goal_alerts: v })}
          />
        </div>

        <div className="flex items-center justify-between p-4 border-2 border-black bg-white shadow-neo-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 border-2 border-black bg-live-red flex items-center justify-center">
              <span className="material-symbols-outlined text-black">timer</span>
            </div>
            <div>
              <p className="font-bold uppercase text-sm">Full-time results</p>
              <p className="text-xs font-medium text-on-surface opacity-60">Final scores and stats</p>
            </div>
          </div>
          <Toggle
            label=""
            checked={preferences.result_summaries}
            onChange={(v) => onChange({ result_summaries: v })}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-live-red mb-4 text-center">{error}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full h-14 bg-primary border-4 border-black shadow-neo text-black font-black uppercase text-lg flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-6 w-6 text-black" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </>
        ) : (
          <>
            Get started
            <span className="material-symbols-outlined font-black">arrow_forward</span>
          </>
        )}
      </button>
      <p className="text-center text-[10px] font-bold uppercase mt-6 px-4 leading-tight text-on-surface opacity-50">
        By clicking &quot;Get started&quot;, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}

export default PreferencesStep;
