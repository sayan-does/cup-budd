import TeamBadge from '../team/TeamBadge';
import { GroupBadge } from '../ui';

interface Team {
  id: number;
  name: string;
  logo_url?: string | null;
  emoji?: string;
}

interface MatchData {
  id: number;
  home_team: Team;
  away_team: Team;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string;
  datetime: string;
  venue: string;
}

interface MatchCardProps {
  match: MatchData;
  onClick?: () => void;
  timezone?: string;
  variant?: 'next' | 'recent';
}

function formatMatchTime(datetime: string, tz?: string): string {
  try {
    const d = new Date(datetime);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeOpts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    if (tz) timeOpts.timeZone = tz;

    const timeStr = d.toLocaleTimeString(undefined, timeOpts);

    if (d.toDateString() === now.toDateString()) return `Today, ${timeStr}`;
    if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${timeStr}`;

    const dateOpts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (tz) dateOpts.timeZone = tz;
    return d.toLocaleDateString(undefined, dateOpts) + `, ${timeStr}`;
  } catch {
    return datetime;
  }
}

function MatchCard({ match, onClick, timezone, variant = 'next' }: MatchCardProps) {
  if (variant === 'recent') {
    return (
      <button
        onClick={onClick}
        className="w-full text-left bg-white brutalist-border brutalist-shadow-sm p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3 w-1/3">
          <TeamBadge team={match.home_team} size="sm" bordered />
          <span className="font-space font-black text-lg">{match.home_team.name.slice(0, 3).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3 bg-black text-white px-5 py-2">
          <span className="font-space font-black text-2xl">{match.home_score ?? '-'}</span>
          <span className="text-primary font-black text-xl">:</span>
          <span className="font-space font-black text-2xl opacity-60">{match.away_score ?? '-'}</span>
        </div>
        <div className="flex items-center justify-end gap-3 w-1/3">
          <span className="font-space font-black text-lg opacity-60">{match.away_team.name.slice(0, 3).toUpperCase()}</span>
          <TeamBadge team={match.away_team} size="sm" bordered />
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface brutalist-border p-6 relative bg-accent-ochre/10"
    >
      {/* decorative corner accent removed — View Details button is sufficient */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col items-center gap-3 w-1/3">
          <TeamBadge team={match.home_team} size="lg" bordered />
          <span className="font-space font-bold text-body-md uppercase text-on-surface">{match.home_team.name}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-primary font-bold text-3xl font-space italic">VS</span>
          <GroupBadge label={match.stage} />
        </div>
        <div className="flex flex-col items-center gap-3 w-1/3">
          <TeamBadge team={match.away_team} size="lg" bordered />
          <span className="font-space font-bold text-body-md uppercase text-on-surface">{match.away_team.name}</span>
        </div>
      </div>
      <div className="border-t-2 border-black py-5 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary font-bold">calendar_today</span>
          <span className="text-caption font-bold uppercase tracking-tight text-on-surface">
            {formatMatchTime(match.datetime, timezone)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary font-bold">location_on</span>
          <span className="text-caption font-bold uppercase tracking-tight text-on-surface">{match.venue}</span>
        </div>
      </div>
      <div className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase text-lg flex items-center justify-center hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#000000] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-all">
        View Details
      </div>
    </button>
  );
}

export default MatchCard;
