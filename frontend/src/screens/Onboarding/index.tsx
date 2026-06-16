import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';
import { createUser, updatePushSubscription } from '../../api/users';
import StepIndicator from '../../components/ui/StepIndicator';
import EmailStep from './EmailStep';
import TeamStep from './TeamStep';
import InstallStep from './InstallStep';
import PushStep from './PushStep';
import PreferencesStep from './PreferencesStep';

interface OnboardingData {
  email: string;
  teamId: number;
  teamName: string;
  timezone: string;
  pushSubscription: PushSubscription | null;
  preferences: {
    match_reminders: boolean;
    goal_alerts: boolean;
    result_summaries: boolean;
  };
}

function Onboarding() {
  const navigate = useNavigate();
  const store = useUserStore();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    email: '',
    teamId: 0,
    teamName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pushSubscription: null,
    preferences: {
      match_reminders: true,
      goal_alerts: true,
      result_summaries: true,
    },
  });

  const update = useCallback((partial: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await createUser({
        email: data.email,
        favorite_team_id: data.teamId,
        timezone: data.timezone,
        preferences: data.preferences,
      });

      if (data.pushSubscription) {
        const sub = data.pushSubscription.toJSON();
        await updatePushSubscription({
          endpoint: sub.endpoint!,
          keys: sub.keys! as { p256dh: string; auth: string },
        });
      }

      store.setEmail(data.email);
      store.setTeam(data.teamId, data.teamName);
      store.setPreferences(data.preferences);
      store.markOnboardingComplete();

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    <EmailStep
      key="email"
      email={data.email}
      onChange={(email) => update({ email })}
      onNext={() => setStep(1)}
    />,
    <TeamStep
      key="team"
      selectedId={data.teamId}
      onSelect={(id, name) => update({ teamId: id, teamName: name })}
      onNext={() => setStep(2)}
    />,
    <InstallStep
      key="install"
      onSkip={() => setStep(3)}
      onInstalled={() => setStep(3)}
    />,
    <PushStep
      key="push"
      onSubscriptionReady={(sub) => update({ pushSubscription: sub })}
      onSkip={() => setStep(4)}
    />,
    <PreferencesStep
      key="prefs"
      preferences={data.preferences}
      onChange={(prefs) => update({ preferences: { ...data.preferences, ...prefs } })}
      loading={loading}
      error={error}
      onSubmit={handleSubmit}
    />,
  ];

  return (
    <div className="min-h-dvh bg-surface-variant md:flex md:justify-center">
      <div className="mx-auto min-h-dvh w-full max-w-container-max-width bg-surface md:border-x-2 md:border-black flex flex-col">
        <StepIndicator steps={5} currentStep={step} />
        <div className="flex-1 flex flex-col">
          {steps[step]}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
