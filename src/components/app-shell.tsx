'use client';

import { type ReactNode } from 'react';
import { SidebarProvider } from './sidebar-context';
import { TopBarShell } from './top-bar';
import { CommandSidebarShell } from './command-sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <TopBarShell />
      <CommandSidebarShell />
      {children}
    </SidebarProvider>
  );
}
