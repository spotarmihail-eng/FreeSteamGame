"use client";

export type FsgRole = "user" | "moderator" | "admin" | "owner";

const roleMeta: Record<FsgRole, { label: string; symbol: string }> = {
  user: { label: "Пользователь", symbol: "●" },
  moderator: { label: "Модератор", symbol: "◆" },
  admin: { label: "Администратор", symbol: "✦" },
  owner: { label: "Владелец", symbol: "♛" }
};

export function RoleBadge({ role }: { role: FsgRole }) {
  const item = roleMeta[role] ?? roleMeta.user;
  return <span className={`role-badge role-${role}`} title={item.label}>
    <span aria-hidden="true">{item.symbol}</span>{item.label}
  </span>;
}
