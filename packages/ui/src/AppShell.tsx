import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon?: React.ComponentType<{ className?: string }>;
}

interface AppShellProps {
  navItems: NavItem[];
}

export function AppShell({ navItems }: AppShellProps) {
  return (
    <div className="h-screen w-full overflow-hidden flex flex-col bg-white">
      <main className="flex-1 overflow-hidden relative min-h-0">
        <Outlet />
      </main>
      <nav className="flex-shrink-0 h-16 border-t border-gray-100 bg-white flex items-center z-30">
        {navItems.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}

function NavTab({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-colors duration-150 ${
          isActive ? 'text-black' : 'text-gray-400'
        }`
      }
    >
      {({ isActive }) => {
        const Icon = isActive && item.activeIcon ? item.activeIcon : item.icon;
        return (
          <>
            <Icon className="h-6 w-6" />
            <span className={`text-[10px] font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </>
        );
      }}
    </NavLink>
  );
}
