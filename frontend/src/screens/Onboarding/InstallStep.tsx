import InstallPrompt from '../../components/ui/InstallPrompt';

interface InstallStepProps {
  onSkip: () => void;
  onInstalled: () => void;
}

function InstallStep({ onSkip, onInstalled }: InstallStepProps) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <InstallPrompt onSkip={onSkip} onInstalled={onInstalled} />
    </div>
  );
}

export default InstallStep;
