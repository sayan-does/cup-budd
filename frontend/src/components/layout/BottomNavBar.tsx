import { useNavigate, useLocation } from 'react-router-dom';

interface TabItem {
  icon: string;
  label: string;
  route: string;
}

const tabs: TabItem[] = [
  { icon: 'home', label: 'Home', route: '/' },
  { icon: 'sports_soccer', label: 'Matches', route: '/matches' },
  { icon: 'leaderboard', label: 'Table', route: '/table' },
  { icon: 'person', label: 'Profile', route: '/profile' },
];

function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-container-max-width flex items-center justify-around h-row-min-height border-t-2 border-black bg-white px-2">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.route;
        return (
          <button
            key={tab.route}
            onClick={() => navigate(tab.route)}
            className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors ${
              isActive
                ? 'bg-black text-white border-x-2 border-black'
                : 'text-black hover:bg-accent-ochre/20'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
            >
              {tab.icon}
            </span>
            <span className="font-label-sm uppercase mt-0.5">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNavBar;
