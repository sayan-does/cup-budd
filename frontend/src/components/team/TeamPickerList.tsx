import { useState, useMemo } from 'react';
import TeamBadge from './TeamBadge';

interface Team {
  id: number;
  name: string;
  code: string;
  group: string;
  logo_url?: string | null;
  emoji?: string;
}

interface TeamPickerListProps {
  teams: Team[];
  selectedId: number | null;
  onSelect: (id: number, name: string) => void;
  onContinue?: () => void;
}

function TeamPickerList({ teams, selectedId, onSelect, onContinue }: TeamPickerListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, Team[]>();
    for (const team of filtered) {
      const group = team.group || 'Other';
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(team);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const selected = teams.find((t) => t.id === selectedId);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-2 pb-3">
        <input
          type="text"
          placeholder="Search teams..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 px-4 brutalist-border bg-surface-variant text-base focus:outline-none focus:border-primary font-body-md"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {grouped.map(([group, groupTeams]) => (
          <div key={group} className="mb-4">
            <p className="font-section-label text-on-surface uppercase mb-2 border-l-4 border-primary pl-1">
              Group {group}
            </p>
            {groupTeams.map((team) => {
              const isSelected = team.id === selectedId;
              return (
                <button
                  key={team.id}
                  onClick={() => onSelect(team.id, team.name)}
                  className={`flex items-center gap-3 w-full min-h-[56px] px-3 border-b-2 border-black transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-accent-ochre/10'
                  }`}
                >
                  <TeamBadge team={team} size="sm" bordered />
                  <span className="text-body-md font-bold text-on-surface uppercase">{team.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selected && onContinue && (
        <div className="sticky bottom-0 p-4 border-t-2 border-black bg-white">
          <button
            onClick={onContinue}
            className="w-full h-touch-target bg-primary text-on-primary brutalist-border brutalist-shadow font-space font-bold uppercase"
          >
            Continue with {selected.name}
          </button>
        </div>
      )}
    </div>
  );
}

export default TeamPickerList;
