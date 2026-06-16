interface GroupBadgeProps {
  label: string;
}

function GroupBadge({ label }: GroupBadgeProps) {
  return (
    <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase">
      {label}
    </span>
  );
}

export default GroupBadge;
