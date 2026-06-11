import { FIFA_TO_ISO } from "@/lib/flags";

export function TeamFlag({ fifaCode }: { fifaCode: string }) {
  const iso = FIFA_TO_ISO[fifaCode];
  if (!iso) return null;
  return <span className={`fi fi-${iso} rounded-[2px]`} aria-hidden />;
}

type Props = {
  team: { name: string; fifaCode: string } | null;
  placeholder: string | null;
};

export function TeamLabel({ team, placeholder }: Props) {
  if (!team) {
    return <span className="text-slate-400">{placeholder ?? "Por definir"}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <TeamFlag fifaCode={team.fifaCode} />
      {team.name}
    </span>
  );
}
