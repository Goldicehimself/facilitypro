import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const GreetingBanner = ({ subtitle = 'Here’s what’s happening today.' }) => {
  const { user } = useAuth();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.role) return user.role.replace(/_/g, ' ');
    return 'there';
  }, [user]);

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.65)]">
      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
        Welcome {displayName}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-2">{greeting}</h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
};

export default GreetingBanner;
