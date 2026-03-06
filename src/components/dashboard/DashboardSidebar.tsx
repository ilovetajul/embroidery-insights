import { BarChart3, LayoutDashboard, Upload, Table2, Settings, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Upload, label: "Upload Data" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Table2, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

export function DashboardSidebar({ open, onToggle }: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          open ? "w-60 translate-x-0" : "w-0 -translate-x-full lg:w-16 lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border min-h-[56px]">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center shrink-0">
            <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {open && (
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight whitespace-nowrap">
              DefectIQ
            </span>
          )}
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-hidden">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {open && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-sidebar-border">
          <button
            onClick={onToggle}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent/50 transition-colors"
          >
            {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {open && (
            <p className="text-[10px] text-sidebar-foreground/40 uppercase tracking-widest mt-2 px-2">
              DefectIQ v2.0
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
