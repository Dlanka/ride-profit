import { useState, useMemo } from 'react';
import {
  Zap, Banknote, MapPin, Route, Percent, DollarSign,
  ToggleLeft, ToggleRight, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, ArrowRight, Sparkles, Fuel, Wrench
} from 'lucide-react';
import { evaluateHire, formatLKR } from '../utils/calculations';

export default function HireCheckTab({ t, settings }) {
  const [fare, setFare] = useState('');
  const [pickupDist, setPickupDist] = useState('');
  const [tripDist, setTripDist] = useState('');
  const [commission, setCommission] = useState('15');
  const [totalDeduction, setTotalDeduction] = useState('');
  const [emptyReturn, setEmptyReturn] = useState(false);

  // Live real-time calculation whenever inputs change
  const evaluation = useMemo(() => {
    const f = parseFloat(fare);
    const td = parseFloat(tripDist);
    if (!f || !td || f <= 0 || td <= 0) {
      return null;
    }
    const p = parseFloat(pickupDist) || 0;
    const c = parseFloat(commission) || 0;
    const ded = parseFloat(totalDeduction) || 0;
    return evaluateHire(f, p, td, c, emptyReturn, settings, ded);
  }, [fare, pickupDist, tripDist, commission, totalDeduction, emptyReturn, settings]);

  const handleClear = () => {
    setFare('');
    setPickupDist('');
    setTripDist('');
    setTotalDeduction('');
    setEmptyReturn(false);
  };

  const setCommissionPreset = (val) => {
    setCommission(String(val));
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{t.hireCheckTitle}</h2>
            <p className="text-[11px] text-slate-400">{t.hireCheckDesc}</p>
          </div>
        </div>
        {(fare || tripDist || pickupDist || totalDeduction) && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.clear}</span>
          </button>
        )}
      </div>

      {/* Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg shadow-black/20">
        {/* Offered Fare */}
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-400" />
              {t.offeredFare}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">PickMe / Uber / Cash</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="10"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-slate-100 placeholder-slate-600 font-mono text-xl font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
              LKR
            </span>
          </div>
        </div>

        {/* Pickup & Trip Distances (Fixed Alignment) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">{t.pickupDistance}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={pickupDist}
                onChange={(e) => setPickupDist(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                km
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <Route className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{t.tripDistance}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                value={tripDist}
                onChange={(e) => setTripDist(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-semibold"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                km
              </span>
            </div>
          </div>
        </div>

        {/* Deductions: App Commission (%) + Total / Other Deduction (LKR) */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* App Commission */}
          <div>
            <div className="flex items-center justify-between mb-1.5 h-5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 truncate">
                <Percent className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">{t.commission}</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                placeholder="15"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                %
              </span>
            </div>
            {/* Quick Commission Presets */}
            <div className="flex items-center gap-1 mt-1.5">
              {[0, 10, 15, 20].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setCommissionPreset(rate)}
                  className={`flex-1 text-[10px] py-0.5 rounded font-mono transition-all text-center ${
                    commission === String(rate)
                      ? 'bg-purple-500 text-white font-bold'
                      : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Total / Other Deduction (LKR) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 h-5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 truncate">
                <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{t.totalDeduction}</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="number"
                step="10"
                value={totalDeduction}
                onChange={(e) => setTotalDeduction(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-semibold"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                LKR
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5 truncate">
              {t.totalDeductionSub}
            </span>
          </div>
        </div>

        {/* Empty Return Toggle */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setEmptyReturn(!emptyReturn)}
          onKeyDown={(e) => e.key === 'Enter' && setEmptyReturn(!emptyReturn)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
            emptyReturn
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>{t.emptyReturnExpected}</span>
              {emptyReturn && <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.2 rounded font-mono">2x Dist</span>}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.emptyReturnExpectedSub}</p>
          </div>
          {emptyReturn ? (
            <ToggleRight className="w-7 h-7 text-amber-400 shrink-0" />
          ) : (
            <ToggleLeft className="w-7 h-7 text-slate-600 shrink-0" />
          )}
        </div>
      </div>

      {/* Real-time Verdict & Profit Breakdown */}
      {evaluation ? (
        <div className="space-y-3 animate-slide-up">
          {/* Main Verdict Card */}
          <div
            className={`rounded-2xl p-4 text-center shadow-xl border relative overflow-hidden transition-all ${
              evaluation.isProfitable
                ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 border-emerald-500/50 text-white'
                : 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 border-rose-500/50 text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1.5">
              {evaluation.isProfitable ? (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-400" />
                </div>
              )}
              <span className={`text-sm font-extrabold uppercase tracking-wide ${evaluation.isProfitable ? 'text-emerald-300' : 'text-rose-300'}`}>
                {evaluation.isProfitable ? t.resultAccept : t.resultReject}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 mb-2">
              {evaluation.isProfitable ? t.resultAcceptSub : t.resultRejectSub}
            </p>

            <div className="my-2 py-2 bg-slate-950/60 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                {t.netProfitResult}
              </span>
              <p className={`text-3xl font-black font-mono tracking-tight ${evaluation.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatLKR(evaluation.netProfit)}
              </p>
              <div className="flex items-center justify-center gap-1 text-xs mt-0.5">
                <span className="text-slate-400">{t.profitPerKm}:</span>
                <span className={`font-mono font-bold ${evaluation.profitPerKm >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatLKR(evaluation.profitPerKm)}/km
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Cost & Math Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Fare & Operating Cost Math
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{t.offeredFare}</span>
                <span className="font-mono font-semibold text-slate-200">{formatLKR(evaluation.offeredFare)}</span>
              </div>

              {evaluation.commissionAmount > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Commission ({commission}%)</span>
                  <span className="font-mono font-semibold text-rose-400">-{formatLKR(evaluation.commissionAmount)}</span>
                </div>
              )}

              {evaluation.otherDeductions > 0 && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">{t.totalDeduction}</span>
                  <span className="font-mono font-semibold text-rose-400">-{formatLKR(evaluation.otherDeductions)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-300 font-medium">{t.earningsAfterCommission}</span>
                <span className="font-mono font-bold text-slate-100">{formatLKR(evaluation.earningsAfterCommission)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-amber-400" />
                  Fuel Cost ({evaluation.totalDistance.toFixed(1)} km)
                </span>
                <span className="font-mono font-semibold text-amber-400">-{formatLKR(evaluation.fuelCost)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-sky-400" />
                  Maintenance ({evaluation.totalDistance.toFixed(1)} km)
                </span>
                <span className="font-mono font-semibold text-sky-400">-{formatLKR(evaluation.maintenanceCost)}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 font-semibold">{t.totalCost}</span>
                <span className="font-mono font-bold text-rose-400">-{formatLKR(evaluation.totalCost)}</span>
              </div>

              <div className="flex justify-between items-center pt-1.5">
                <span className="text-amber-400 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t.minimumFare}
                </span>
                <span className="font-mono font-bold text-amber-300">{formatLKR(evaluation.minimumFare)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Quick Instructions */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">{t.hireCheckPlaceholderTitle}</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t.hireCheckPlaceholderDesc}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>⚡ Real-Time Math</span>
            <span>•</span>
            <span>⛽ Fuel Factored</span>
            <span>•</span>
            <span>🔧 Maintenance Included</span>
          </div>
        </div>
      )}
    </div>
  );
}
