import { useQuery } from '@tanstack/react-query';
import { fetchTeams } from '../../api/teams';
import TeamPickerList from '../../components/team/TeamPickerList';

interface TeamStepProps {
  selectedId: number;
  onSelect: (id: number, name: string) => void;
  onNext: () => void;
}

function TeamStep({ selectedId, onSelect, onNext }: TeamStepProps) {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
    staleTime: 1000 * 60 * 60 * 24,
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-body-md text-on-surface opacity-50">Loading teams...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="font-headline-lg text-on-surface px-6 pt-2 pb-4 uppercase tracking-tight">Pick your team</h1>
      <div className="flex-1">
        <TeamPickerList
          teams={teams ?? []}
          selectedId={selectedId}
          onSelect={onSelect}
          onContinue={selectedId ? onNext : undefined}
        />
      </div>
    </div>
  );
}

export default TeamStep;
