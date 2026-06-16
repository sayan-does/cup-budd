import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

interface TopAppBarProps {
  onBack?: () => void;
  showSettings?: boolean;
  title?: string;
  showMenu?: boolean;
}

function TopAppBar({ onBack, showSettings, title, showMenu }: TopAppBarProps) {
  const navigate = useNavigate();
  const favoriteTeamName = useUserStore((s) => s.favoriteTeamName);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-container-max-width flex items-center justify-between border-b-2 border-black bg-white px-gutter h-row-min-height">
      <div className="flex items-center gap-stack-sm">
        {onBack && (
          <button onClick={onBack} className="flex items-center justify-center h-touch-target w-touch-target" aria-label="Go back">
            <span className="material-symbols-outlined text-black font-bold">arrow_back</span>
          </button>
        )}
        {showMenu && (
          <span className="material-symbols-outlined text-black cursor-pointer font-bold">menu</span>
        )}
        {title && <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">{title}</h1>}
        {!title && !onBack && favoriteTeamName && (
          <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight">{favoriteTeamName}</h1>
        )}
      </div>
      {showSettings && (
        <button onClick={() => navigate('/profile')} className="flex items-center justify-center h-touch-target w-touch-target" aria-label="Settings">
          <span className="material-symbols-outlined text-black cursor-pointer">settings</span>
        </button>
      )}
    </header>
  );
}

export default TopAppBar;
