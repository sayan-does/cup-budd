interface SectionLabelProps {
  children: string;
  accentColor?: 'primary' | 'accent-ochre' | 'live-red';
}

const accentMap = {
  primary: 'border-l-4 border-primary',
  'accent-ochre': 'border-l-4 border-accent-ochre',
  'live-red': 'border-l-4 border-live-red',
};

function SectionLabel({ children, accentColor = 'primary' }: SectionLabelProps) {
  return (
    <h2 className={`font-section-label text-on-surface uppercase mb-3 px-1 ${accentMap[accentColor]}`}>
      {children}
    </h2>
  );
}

export default SectionLabel;
