import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Settings, Calendar, Users, DollarSign, Shield } from 'lucide-react';

export type NavTab = 'dashboard' | 'calendar' | 'settings' | 'project' | 'clients' | 'finances' | 'admin';

interface BottomNavProps {
  currentTab: NavTab;
  setTab: (tab: NavTab) => void;
  setActiveProjectId: (id: string | null) => void;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setTab,
  setActiveProjectId,
  isAdmin,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState<'start' | 'mid' | 'end'>('start');

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      if (el.scrollLeft <= 2) setScrollState('start');
      else if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) setScrollState('end');
      else setScrollState('mid');
    };
    el.addEventListener('scroll', update, { passive: true });
    update();
    return () => el.removeEventListener('scroll', update);
  }, []);

  const items: { tab: NavTab; label: string; Icon: React.ComponentType<{ size?: number }>; activeWhen?: NavTab[] }[] = [
    { tab: 'dashboard', label: 'Proyectos', Icon: LayoutDashboard, activeWhen: ['dashboard', 'project'] },
    { tab: 'finances' as NavTab, label: 'Facturas', Icon: DollarSign, activeWhen: ['finances'] },
    { tab: 'clients' as NavTab, label: 'Clientes', Icon: Users, activeWhen: ['clients'] },
    { tab: 'calendar' as NavTab, label: 'Calendario', Icon: Calendar, activeWhen: ['calendar'] },
    ...(isAdmin ? [{ tab: 'admin' as NavTab, label: 'Admin', Icon: Shield }] : []),
    ...(isAdmin ? [{ tab: 'settings' as NavTab, label: 'Ajustes', Icon: Settings }] : []),
  ];

  const scrollClass = scrollState === 'start' ? 'scroll-start' : scrollState === 'end' ? 'scroll-end' : '';

  return (
    <nav ref={navRef} className={`bottom-nav can-scroll-${scrollState !== 'end' ? 'start' : 'end'} ${scrollClass}`}>
      <div className="bottom-nav-inner">
        {items.map(({ tab, label, Icon, activeWhen }) => {
          const isActive = activeWhen
            ? activeWhen.includes(currentTab)
            : currentTab === tab;
          return (
            <button
              key={tab}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => { setTab(tab); setActiveProjectId(null); }}
              title={label}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
