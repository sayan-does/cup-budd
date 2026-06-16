/**
 * Debug version of TeamBadge to see what data is being received
 * Temporarily replace TeamBadge import with this to debug
 */

interface TeamBadgeTeam {
  id: number;
  name: string;
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

function TeamBadgeDebug({ team, size = 'md', bordered }: TeamBadgeProps) {
  const px = sizeMap[size];

  // DEBUG: Log team data
  console.log('TeamBadge render:', {
    teamName: team.name,
    hasLogoUrl: !!team.logo_url,
    logoUrl: team.logo_url,
    fullTeam: team
  });

  if (team.logo_url) {
    const img = (
      <img
        src={team.logo_url}
        alt={`${team.name} flag`}
        width={px}
        height={px}
        className="object-cover rounded"
        loading="lazy"
        onLoad={() => {
          console.log(`✓ Flag loaded for ${team.name}:`, team.logo_url);
        }}
        onError={(e) => {
          console.error(`✗ Flag failed to load for ${team.name}:`, team.logo_url);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    );
    if (bordered) {
      return (
        <div className="brutalist-border p-1 bg-white flex items-center justify-center" style={{ width: px + 8, height: px + 8 }}>
          {img}
        </div>
      );
    }
    return img;
  }

  // DEBUG: No logo URL
  console.warn(`⚠️ No logo_url for ${team.name}`);

  const fallback = (
    <span
      className="flex items-center justify-center bg-surface-variant border-2 border-black"
      style={{ width: px, height: px, fontSize: px * 0.5 }}
      aria-label={team.name}
    >
      {team.emoji ?? '?'}
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

export default TeamBadgeDebug;
