import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtext?: string;
  trend?: {
    value: string;
    type: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtext,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <div className={`p-6 bg-[#121215]/90 backdrop-blur-md border border-[#1f1f24] rounded-3xl relative overflow-hidden transition-all hover:border-[#32323b] hover:shadow-[0_0_30px_rgba(99,102,241,0.05)] ${className}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
          <h3 className="text-3xl font-extrabold text-white leading-tight tracking-tight mt-1">{value}</h3>
          
          {(trend || subtext) && (
            <div className="flex flex-wrap items-center gap-2 pt-1.5">
              {trend && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border shadow-3xs ${
                  trend.type === 'up'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : trend.type === 'down'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {trend.value}
                </span>
              )}
              {subtext && <span className="text-zinc-400 font-medium text-xs leading-none">{subtext}</span>}
            </div>
          )}
        </div>

        <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
