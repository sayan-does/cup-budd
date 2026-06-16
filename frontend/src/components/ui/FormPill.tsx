interface FormPillProps {
  result: string;
}

function FormPill({ result }: FormPillProps) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 brutalist-border font-black text-xs ${
        result === 'W' ? 'bg-white text-black' : result === 'L' ? 'bg-live-red text-white' : 'bg-surface-variant text-on-surface'
      }`}
    >
      {result}
    </span>
  );
}

export default FormPill;
