import { getAvatar } from "@/lib/avatars";

interface Props {
  avatarKey: string;
  username?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function AvatarCard({
  avatarKey,
  username,
  size = "md",
  showTagline = false,
  selected = false,
  onClick,
}: Props) {
  const avatar = getAvatar(avatarKey);
  if (!avatar) return null;

  const sizeClasses = {
    sm: { wrap: "p-2", emoji: "text-3xl", name: "text-[10px]", tag: "text-[9px]" },
    md: { wrap: "p-4", emoji: "text-5xl", name: "text-xs",     tag: "text-[10px]" },
    lg: { wrap: "p-6", emoji: "text-7xl", name: "text-sm",     tag: "text-xs" },
  }[size];

  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={`
        relative rounded-xl text-center bg-gradient-to-br ${avatar.gradient}
        ${sizeClasses.wrap}
        ${onClick ? "transition-all duration-200 active:scale-95 hover:scale-[1.02] cursor-pointer" : ""}
        ${selected ? `ring-4 ${avatar.ringColor} ring-offset-2 ring-offset-pitch scale-[1.03] shadow-lg` : ""}
      `}
    >
      {selected && (
        <div className="absolute top-2 right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center">
          <span className="text-pitch-dark text-xs font-bold">✓</span>
        </div>
      )}
      <div className={`${sizeClasses.emoji} leading-none mb-1`}>{avatar.emoji}</div>
      <div className={`text-white font-bold leading-tight ${sizeClasses.name}`}>
        {avatar.name}
      </div>
      {username && (
        <div className={`text-white/60 leading-tight mt-0.5 ${sizeClasses.name}`}>
          {username}
        </div>
      )}
      {showTagline && (
        <div className={`text-white/70 italic leading-tight mt-1 line-clamp-2 ${sizeClasses.tag}`}>
          &ldquo;{avatar.tagline}&rdquo;
        </div>
      )}
    </Tag>
  );
}
