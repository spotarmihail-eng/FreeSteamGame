const paths: Record<string, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" />,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></>,
  library: <path d="M5 4v16M10 4v16M15 5.5l4.5 14.5M3 20h18" />,
  sparkles: <path d="M12 3.5l1.9 5.6 5.6 1.9-5.6 1.9L12 18.5l-1.9-5.6L4.5 11l5.6-1.9zM18.5 3v3M17 4.5h3" />,
  users: <><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19c.4-3.4 2.9-5.2 6-5.2s5.6 1.8 6 5.2" /><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M18.5 14.2c1.6.7 2.6 2.2 2.8 4.8" /></>,
  user: <><circle cx="12" cy="8.5" r="3.6" /><path d="M5 20c.5-4 3.2-6 7-6s6.5 2 7 6" /></>,
  gamepad: <><path d="M7 8h10a4.5 4.5 0 0 1 4.4 5.4l-.6 3a2.6 2.6 0 0 1-4.5 1.1L14.6 16H9.4l-1.7 1.5a2.6 2.6 0 0 1-4.5-1.1l-.6-3A4.5 4.5 0 0 1 7 8z" /><path d="M8 10.5v3M6.5 12h3M16 11h.01M18 13h.01" /></>
};

export type IconName = keyof typeof paths;

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}
