import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore';

interface HeaderProps {
  onBack?: () => void;
  showSettings?: boolean;
  title?: string;
}

function Header({ onBack, showSettings, title }: HeaderProps) {
  const navigate = useNavigate();
  const favoriteTeamName = useUserStore((s) => s.favoriteTeamName);

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-11 h-11 text-gray-700"
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        {title && <h1 className="text-lg font-semibold text-gray-900">{title}</h1>}
        {!title && !onBack && favoriteTeamName && (
          <span className="text-lg font-semibold text-gray-900">{favoriteTeamName}</span>
        )}
      </div>
      {showSettings && (
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center w-11 h-11 text-gray-700"
          aria-label="Settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      )}
    </header>
  );
}

export default Header;
