import React, { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AppLayout({ children, className = "" }: AppLayoutProps) {
  return (
    <div className={`w-full min-h-dvh ${className}`}>
      {children}
    </div>
  );
}
