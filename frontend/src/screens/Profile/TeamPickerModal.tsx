import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTeam } from '../../api/users';
import { useUserStore } from '../../stores/userStore';
import { TeamPickerList } from '../../components/team';

interface Team {
  id: number;
  name: string;
  code: string;
  group: string;
  logo_url?: string | null;
  emoji?: string;
}

interface TeamPickerModalProps {
  teams: Team[];
  selectedId: number | null;
  onClose: () => void;
}

function TeamPickerModal({ teams, selectedId, onClose }: TeamPickerModalProps) {
  const queryClient = useQueryClient();

  const teamMutation = useMutation({
    mutationFn: updateTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSelect = (id: number, name: string) => {
    const confirmed = window.confirm(`Switch to ${name}?`);
    if (confirmed) {
      teamMutation.mutate(id);
      useUserStore.getState().setTeam(id, name);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex md:items-center md:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full h-full md:h-auto md:max-h-[80vh] md:w-[480px] bg-white flex flex-col overflow-hidden md:border-2 md:border-black">
        <div className="flex items-center justify-between px-4 h-row-min-height border-b-2 border-black shrink-0">
          <span className="font-headline-lg text-on-surface uppercase tracking-tight">Change team</span>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-touch-target w-touch-target"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <TeamPickerList
            teams={teams}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default TeamPickerModal;
