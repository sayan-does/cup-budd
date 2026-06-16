import { getTeamFlagClass } from '../../utils/teamFlagCode';

interface TeamBadgeTeam {
  id: number;
  name: string;
  code?: string;
  logo_url?: string | null;
  emoji?: string;
}

interface TeamBadgeProps {
  team: TeamBadgeTeam;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

function TeamBadge({ team, size = 'md', bordered }: TeamBadgeProps) {
  const px = sizeMap[size];

  const flagClass = getTeamFlagClass(team.code);

  if (flagClass) {
    const flag = (
      <span 
        className={`${flagClass} rounded`}
        style={{ 
          width: px, 
          height: px * 0.75,  // 4:3 aspect ratio for flags
          display: 'block',
          backgroundSize: 'cover'
        }}
        title={`${team.name} flag`}
      />
    );
    
    if (bordered) {
      return (
        <div className="brutalist-border p-1 bg-white flex items-center justify-center" style={{ width: px + 8, height: px + 8 }}>
          {flag}
        </div>
      );
    }
    return flag;
  }

  // Fallback
  const fallback = (
    <span
      className="flex items-center justify-center bg-surface-variant border-2 border-black"
      style={{ 
        width: px, 
        height: px,
        fontSize: px * 0.4,
        fontWeight: 'bold'
      }}
      aria-label={team.name}
    >
      {team.code || team.name.slice(0, 2).toUpperCase()}
    </span>
  );

  if (bordered) {
    return (
      <div className="brutalist-border p-1 bg-white" style={{ width: px + 8, height: px + 8 }}>
        {fallback}
      </div>
    );
  }

  return fallback;
}

export default TeamBadge;
