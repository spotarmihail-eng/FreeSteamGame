const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type FsgRole = "user" | "moderator" | "admin" | "owner";

const roles: Record<FsgRole, { label: string; icon: string | null; tone: string }> = {
  user: { label: "Пользователь", icon: null, tone: "#a78bfa" },
  moderator: { label: "Модератор", icon: "/img/roles/moderator.webp", tone: "#ff2d8a" },
  admin: { label: "Администратор", icon: "/img/roles/admin.webp", tone: "#ff9a3c" },
  owner: { label: "Владелец", icon: "/img/roles/owner.webp", tone: "#ff4a3c" }
};

export function RoleBadge({ role, size = 22 }: { role: FsgRole; size?: number }) {
  const item = roles[role] ?? roles.user;
  return (
    <span
      className="role-badge"
      style={{ ["--role-tone" as string]: item.tone }}
      title={item.label}
    >
      {item.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`${basePath}${item.icon}`} alt="" width={size} height={size} loading="lazy" decoding="async" />
      ) : null}
      <span>{item.label}</span>
    </span>
  );
}
