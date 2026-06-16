import TeamBadge from './TeamBadge';
import { FormPill } from '../ui';

interface Team {
  id: number;
  name: string;
  code: string;
  group: string;
  logo_url?: string | null;
  emoji?: string;
}

interface Standing {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  form: string[];
}

interface StandingCardProps {
  standing: Standing;
  // allow passing parent team when the API standing object does not include the team
  team?: Team;
  isUserTeam?: boolean;
}

function StandingCard({ standing, team, isUserTeam }: StandingCardProps) {
  const resolvedTeam = standing.team ?? team ?? ({ id: 0, name: 'Unknown', code: '', group: '', logo_url: null } as Team);
  return (
    <div className={`brutalist-border ${isUserTeam ? 'bg-primary/10' : 'bg-surface'}`}>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <span className="font-space text-4xl font-black text-on-surface">{standing.position}.</span>
          <div className="flex items-center gap-3">
            <TeamBadge team={resolvedTeam} size="sm" bordered />
            <span className="font-space font-bold text-xl uppercase text-on-surface">{resolvedTeam.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center bg-black text-white px-3 py-1">
            <span className="text-[10px] font-black uppercase leading-none">PTS</span>
            <span className="text-2xl font-black leading-tight">{standing.points}</span>
          </div>
            <div className="flex gap-1.5">
              {(standing.form ?? []).map((r, i) => (
                <FormPill key={i} result={r} />
              ))}
            </div>
        </div>
      </div>
    </div>
  );
}

export default StandingCard;
