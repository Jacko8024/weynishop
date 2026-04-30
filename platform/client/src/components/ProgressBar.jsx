import { Check, Package, ChefHat, BoxIcon, Truck, MapPin, BadgeDollarSign } from 'lucide-react';
import { STAGES, STAGE_LABELS, stageIndex } from '../lib/helpers.js';

const ICONS = {
  placed: Package,
  preparing: ChefHat,
  ready_for_pickup: BoxIcon,
  picked_up: Truck,
  out_for_delivery: MapPin,
  delivered_paid: BadgeDollarSign,
};

export default function ProgressBar({ currentStage, stages = [], cancelled = false }) {
  const cur = stageIndex(currentStage);

  if (cancelled) {
    return (
      <div className="card p-4 bg-danger-50 border-danger-200 text-danger-700 font-medium">
        Order cancelled
      </div>
    );
  }

  const tsByStage = Object.fromEntries(
    stages.map((s) => [s.stage, new Date(s.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })])
  );

  return (
    <div className="card p-5 overflow-x-auto">
      <div className="flex items-start justify-between min-w-[640px] gap-2">
        {STAGES.map((stage, i) => {
          const Icon = ICONS[stage];
          const done = i < cur;
          const active = i === cur;
          const pending = i > cur;
          return (
            <div key={stage} className="flex-1 flex flex-col items-center text-center relative">
              {i > 0 && (
                <div
                  className={`absolute top-5 right-1/2 w-full h-1 -z-0 ${
                    i <= cur ? 'bg-brand-500' : 'bg-slate-200'
                  } transition-colors duration-500`}
                  style={{ transform: 'translateX(-50%)' }}
                />
              )}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition
                  ${done ? 'bg-brand-500 text-white' : ''}
                  ${active ? 'bg-brand-500 text-white progress-pulse' : ''}
                  ${pending ? 'bg-slate-200 text-slate-400' : ''}`}
              >
                {done ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <div className={`mt-2 text-xs font-medium ${pending ? 'text-slate-400' : 'text-slate-700'}`}>
                {STAGE_LABELS[stage]}
              </div>
              <div className="text-[10px] text-slate-400 h-3">{tsByStage[stage] || ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
