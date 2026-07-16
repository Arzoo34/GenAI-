import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_tabs")({
  component: TabsLayout,
});

function TabsLayout() {
  return (
    <div className="w-full pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
