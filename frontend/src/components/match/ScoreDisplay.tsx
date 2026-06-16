interface ScoreDisplayProps {
  homeScore: number | null;
  awayScore: number | null;
  size?: 'lg' | 'xl';
}

function ScoreDisplay({ homeScore, awayScore, size = 'lg' }: ScoreDisplayProps) {
  const textSize = size === 'xl' ? 'text-6xl' : 'text-4xl';
  return (
    <div className={`${textSize} font-headline-lg font-black tabular-nums text-center`}>
      <span>{homeScore ?? '-'}</span>
      <span className="mx-3 text-primary">:</span>
      <span>{awayScore ?? '-'}</span>
    </div>
  );
}

export default ScoreDisplay;
