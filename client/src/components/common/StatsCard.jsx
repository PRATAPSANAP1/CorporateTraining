import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorMap = {
  indigo: {
    bg: 'from-indigo-500 to-indigo-600',
    glow: 'shadow-indigo-500/20',
    badge: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    border: 'hover:border-indigo-500/30',
  },
  blue: {
    bg: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/20',
    badge: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    border: 'hover:border-blue-500/30',
  },
  purple: {
    bg: 'from-purple-500 to-violet-600',
    glow: 'shadow-purple-500/20',
    badge: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    border: 'hover:border-purple-500/30',
  },
  emerald: {
    bg: 'from-emerald-500 to-teal-600',
    glow: 'shadow-emerald-500/20',
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    border: 'hover:border-emerald-500/30',
  },
  amber: {
    bg: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
    border: 'hover:border-amber-500/30',
  },
  rose: {
    bg: 'from-rose-500 to-red-600',
    glow: 'shadow-rose-500/20',
    badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    border: 'hover:border-rose-500/30',
  },
  cyan: {
    bg: 'from-cyan-500 to-sky-600',
    glow: 'shadow-cyan-500/20',
    badge: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    border: 'hover:border-cyan-500/30',
  },
};

const StatsCard = ({ title, value, icon: Icon, color = 'indigo', trend, trendLabel, subtitle }) => {
  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.glow} ${c.border} group overflow-hidden`}>
      {/* Subtle background gradient blob */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${c.bg} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />

      <div className="flex items-start justify-between relative">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                trend > 0
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : trend < 0
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {Math.abs(trend)}%
              </span>
              {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg ${c.glow} group-hover:scale-110 transition-transform duration-300 shrink-0`}>
          {Icon && <Icon className="w-5 h-5 text-white" />}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
