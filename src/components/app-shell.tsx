interface AppShellProps {
  children: React.ReactNode;
}

/**
 * The app layout shell: a full-height flex row whose single child is the
 * scrollable main content. The scroll lives on this inner div (not the window)
 * — ScrollHeader walks up to find this `overflow-y-auto` ancestor.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen">
      {/* Main content — scrollable */}
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
