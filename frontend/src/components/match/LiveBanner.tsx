import { TeamBadge } from '../team';

interface Team {
  id: number;
  name: string;
  code?: string;
  logo_url?: string | null;
  emoji?: string;
}

interface LiveMatch {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
}

interface LiveBannerProps {
  match: LiveMatch;
  onClick?: () => void;
}

function LiveBanner({ match, onClick }: LiveBannerProps) {
  return (
    <div
      onClick={onClick}
      className="sticky top-[64px] z-40 bg-live-red text-white border-b-2 border-black px-gutter py-4 flex items-center justify-between cursor-pointer active:invert transition-all"
    >
      <div className="flex items-center gap-3">
        <span className="live-pulse w-3 h-3 bg-white brutalist-border" />
        <span className="font-section-label text-white uppercase">Live Now</span>
        <div className="flex items-center gap-2 ml-2">
          <TeamBadge team={match.home_team} size="sm" bordered />
          <span className="font-space font-bold text-lg">
            {match.home_team.code || match.home_team.name}
          </span>
          <span className="font-space font-bold text-lg mx-2">
            {match.home_score ?? 0} – {match.away_score ?? 0}
          </span>
          <span className="font-space font-bold text-lg">
            {match.away_team.code || match.away_team.name}
          </span>
          <TeamBadge team={match.away_team} size="sm" bordered />
        </div>
      </div>
      <span className="material-symbols-outlined text-white">arrow_forward</span>
    </div>
  );
}

export default LiveBanner;
