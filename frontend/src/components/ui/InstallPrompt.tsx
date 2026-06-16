import { useInstallPrompt } from '../../hooks/useInstallPrompt';
import { useIsStandalone } from '../../hooks/useIsStandalone';

interface InstallPromptProps {
  onSkip: () => void;
  onInstalled?: () => void;
}

function InstallPrompt({ onSkip, onInstalled }: InstallPromptProps) {
  const { prompt, isInstalled, isPromptAvailable } = useInstallPrompt();
  const isStandalone = useIsStandalone();

  if (isStandalone || isInstalled) {
    return (
      <div className="p-6 text-center">
        <span className="text-5xl mb-4 block">✅</span>
        <p className="font-body-md text-on-surface mb-6">Cup Budd is installed!</p>
        <button
          onClick={onInstalled ?? onSkip}
          className="h-touch-target px-6 bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase"
        >
          Continue
        </button>
      </div>
    );
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator as Navigator & { standalone?: boolean }).standalone === false;

  if (isIOS) {
    return (
      <div className="p-6 text-center">
        <span className="text-5xl mb-4 block">📲</span>
        <p className="font-body-md text-on-surface mb-4 font-bold uppercase">Install on your iPhone:</p>
        <ol className="text-caption text-on-surface opacity-60 text-left space-y-2 mb-6">
          <li>1. Tap the <strong>Share</strong> button</li>
          <li>2. Scroll down and tap <strong>Add to Home Screen</strong></li>
          <li>3. Tap <strong>Add</strong> in the top right</li>
        </ol>
        <button onClick={onSkip} className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase mb-2">
          I've installed it
        </button>
        <button onClick={onSkip} className="text-sm text-on-surface opacity-60 underline font-medium">
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 text-center">
      <span className="text-5xl mb-4 block">📲</span>
      <p className="font-body-md text-on-surface mb-6 font-bold uppercase">Add to your home screen</p>
      {isPromptAvailable && (
        <button
          onClick={prompt}
          className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase mb-2"
        >
          Install App
        </button>
      )}
      {!isPromptAvailable && (
        <p className="text-caption text-on-surface opacity-60 mb-4">Open this page in Chrome and look for the install icon in the address bar.</p>
      )}
      <button onClick={onSkip} className="text-sm text-on-surface opacity-60 underline font-medium">
        Skip for now
      </button>
    </div>
  );
}

export default InstallPrompt;
