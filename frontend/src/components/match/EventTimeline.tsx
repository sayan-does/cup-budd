interface TimelineEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'half_time';
  player?: string;
  team: 'home' | 'away';
  playerImageUrl?: string | null;
}

interface EventTimelineProps {
  events: TimelineEvent[];
}

function EventTimeline({ events }: EventTimelineProps) {
  if (!events.length) {
    return (
      <div className="py-8 text-center text-caption text-on-surface opacity-50">
        No events yet
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => b.minute - a.minute);

  return (
    <div className="relative flex flex-col gap-6 px-gutter before:content-[''] before:absolute before:left-[11px] before:top-0 before:bottom-0 before:w-[2px] before:bg-black">
      {sorted.map((event, i) => {
        if (event.type === 'half_time') {
          return (
            <div key={i} className="flex items-center gap-4 relative z-10">
              <div className="w-[0px] h-[1px]" />
              <div className="flex-grow border-t-2 border-black" />
              <span className="font-bold text-[10px] uppercase bg-black text-white px-3 py-1">
                HT {events.find(e => e.type === 'goal' && e.minute < 45) ? '1 – 0' : '0 – 0'}
              </span>
              <div className="flex-grow border-t-2 border-black" />
            </div>
          );
        }

        const isGoal = event.type === 'goal';
        const isYellow = event.type === 'yellow_card';

        return (
          <div key={i} className="flex gap-4 items-start relative z-10">
            <div className="flex flex-col items-center mt-1">
              <div
                className={`w-6 h-6 border-2 border-black flex items-center justify-center ${
                  isGoal ? 'bg-primary' : isYellow ? 'bg-accent-ochre' : 'bg-black'
                }`}
              >
                {isGoal ? (
                  <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>sports_soccer</span>
                ) : isYellow ? (
                  <div className="w-2 h-3 bg-black" />
                ) : (
                  <span className="material-symbols-outlined text-[14px] text-white">block</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 bg-white brutalist-border p-3 flex-grow brutalist-shadow-sm">
              <div className="flex justify-between border-b border-black/10 pb-1">
                <span className="font-black text-sm uppercase">
                  {event.minute}'{isGoal ? ' GOAL!' : isYellow ? ' YELLOW CARD' : ''}
                </span>
                <span className="font-bold text-[10px] uppercase text-on-surface opacity-60">
                  {event.team === 'home' ? 'Home' : 'Away'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {event.playerImageUrl ? (
                  <div className="w-10 h-10 border-2 border-black bg-surface-variant overflow-hidden">
                    <img src={event.playerImageUrl} alt={event.player} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 border-2 border-black bg-surface-variant flex items-center justify-center">
                    <span className="font-bold text-sm text-on-surface">
                      {event.player?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </span>
                  </div>
                )}
                <span className="font-bold text-base text-on-surface">
                  {event.player || 'Unknown'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EventTimeline;
