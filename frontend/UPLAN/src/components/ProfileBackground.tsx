import type { ReactNode } from 'react';

export const profileBackgroundChoices = [
  {
    id: 'blueprint',
    name: 'Blueprint desk',
    baseClass: 'bg-[#0b3b5a]',
  },
  {
    id: 'constellation',
    name: 'Night notes',
    baseClass: 'bg-[#13221a]',
  },
  {
    id: 'paperplane',
    name: 'Paper flight',
    baseClass: 'bg-[#7f2f46]',
  },
  {
    id: 'rings',
    name: 'Study rings',
    baseClass: 'bg-[#263238]',
  },
  {
    id: 'lab',
    name: 'Lab board',
    baseClass: 'bg-[#4f3b16]',
  },
];

const getChoice = (themeId?: string | null) =>
  profileBackgroundChoices.find((choice) => choice.id === themeId) || profileBackgroundChoices[0];

function Pattern({ id }: { id: string }) {
  switch (id) {
    case 'constellation':
      return (
        <>
          <span className="absolute left-5 top-5 h-2 w-2 rounded-full bg-[#f6d365]" />
          <span className="absolute left-20 top-10 h-1.5 w-1.5 rounded-full bg-[#f8fafc]" />
          <span className="absolute right-12 top-7 h-2.5 w-2.5 rounded-full bg-[#7dd3fc]" />
          <span className="absolute bottom-9 left-12 h-px w-24 rotate-12 bg-white/35" />
          <span className="absolute bottom-16 right-8 h-px w-28 -rotate-12 bg-white/25" />
          <span className="absolute bottom-7 right-28 h-2 w-2 rounded-full bg-[#fb7185]" />
          <span className="absolute right-20 top-20 h-20 w-20 rounded-full border border-white/20" />
        </>
      );
    case 'paperplane':
      return (
        <>
          <span className="absolute left-6 top-6 h-16 w-24 rotate-[-14deg] border-l-2 border-t-2 border-white/35" />
          <span className="absolute right-7 top-10 h-12 w-12 rotate-45 border-r-2 border-t-2 border-[#fef3c7]/70" />
          <span className="absolute bottom-8 left-10 h-px w-28 rotate-[-8deg] bg-white/35" />
          <span className="absolute bottom-14 left-24 h-px w-20 rotate-[10deg] bg-white/25" />
          <span className="absolute bottom-4 right-8 h-12 w-28 rounded-full border border-white/20" />
          <span className="absolute right-28 top-4 h-5 w-5 rounded-sm bg-[#facc15]/80" />
        </>
      );
    case 'rings':
      return (
        <>
          <span className="absolute -left-8 -top-10 h-32 w-32 rounded-full border-[14px] border-[#4ade80]/35" />
          <span className="absolute right-8 top-6 h-24 w-24 rounded-full border-[10px] border-[#38bdf8]/40" />
          <span className="absolute bottom-[-26px] left-24 h-28 w-28 rounded-full border-[12px] border-[#f87171]/35" />
          <span className="absolute bottom-10 right-28 h-2 w-20 rounded-full bg-white/30" />
          <span className="absolute left-36 top-12 h-2 w-16 rounded-full bg-white/20" />
        </>
      );
    case 'lab':
      return (
        <>
          <span className="absolute left-8 top-8 h-16 w-16 rounded-full border-2 border-[#fef08a]/55" />
          <span className="absolute left-16 top-16 h-20 w-1 rotate-45 bg-white/25" />
          <span className="absolute right-10 top-8 h-14 w-24 rounded-md border-2 border-white/25" />
          <span className="absolute right-16 top-12 h-2 w-12 rounded-full bg-[#86efac]/80" />
          <span className="absolute bottom-9 left-12 h-2 w-24 rounded-full bg-[#fca5a5]/70" />
          <span className="absolute bottom-14 left-12 h-2 w-16 rounded-full bg-[#93c5fd]/70" />
          <span className="absolute bottom-6 right-9 h-8 w-8 rotate-12 rounded-sm bg-white/15" />
        </>
      );
    default:
      return (
        <>
          <span className="absolute left-0 top-6 h-px w-full bg-white/18" />
          <span className="absolute left-0 top-16 h-px w-full bg-white/18" />
          <span className="absolute left-0 top-28 h-px w-full bg-white/18" />
          <span className="absolute left-10 top-0 h-full w-px bg-white/18" />
          <span className="absolute left-28 top-0 h-full w-px bg-white/18" />
          <span className="absolute right-14 top-0 h-full w-px bg-white/18" />
          <span className="absolute right-8 top-8 h-16 w-16 rounded-full border-2 border-[#f8fafc]/50" />
          <span className="absolute bottom-7 left-16 h-10 w-24 rounded-md border-2 border-[#67e8f9]/50" />
          <span className="absolute bottom-12 right-28 h-2 w-20 rounded-full bg-[#facc15]/80" />
        </>
      );
  }
}

export function ProfileBackgroundCanvas({
  themeId,
  className = '',
  children,
}: {
  themeId?: string | null;
  className?: string;
  children?: ReactNode;
}) {
  const choice = getChoice(themeId);

  return (
    <div className={`relative overflow-hidden ${choice.baseClass} ${className}`}>
      <Pattern id={choice.id} />
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative">{children}</div>
    </div>
  );
}
