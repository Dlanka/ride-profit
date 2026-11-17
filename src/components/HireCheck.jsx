import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Zap, Banknote, MapPin, Route, Percent, DollarSign,
  ToggleLeft, ToggleRight, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, ArrowRight, Sparkles, Fuel, Wrench,
  Table, ChevronDown, ChevronUp
} from 'lucide-react';
import { evaluateHire, formatLKR, calcTotalCostPerKm } from '../utils/calculations';

export default function HireCheckTab({ t, settings }) {
  const defaultCommission = String(settings?.defaultCommission ?? 16);
  const defaultDeduction = String(settings?.defaultDeduction ?? 0);

  const [fare, setFare] = useState('');
  const [pickupDist, setPickupDist] = useState('');
  const [tripDist, setTripDist] = useState('');
  const [commission, setCommission] = useState(defaultCommission);
  const [totalDeduction, setTotalDeduction] = useState(defaultDeduction);
  const [emptyReturn, setEmptyReturn] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(() => {
    const saved = localStorage.getItem('rideprofit_show_cheatsheet');
    return saved !== null ? saved === 'true' : true;
  });

  // Input refs for smooth mobile Enter / Next key navigation
  const fareInputRef = useRef(null);
  const pickupInputRef = useRef(null);
  const tripInputRef = useRef(null);

  // Sync defaults if updated in Settings tab
  useEffect(() => {
    if (settings?.defaultCommission !== undefined) {
      setCommission(String(settings.defaultCommission));
    }
  }, [settings?.defaultCommission]);

  useEffect(() => {
    if (settings?.defaultDeduction !== undefined) {
      setTotalDeduction(String(settings.defaultDeduction));
    }
  }, [settings?.defaultDeduction]);

  const toggleCheatSheet = () => {
    setShowCheatSheet((prev) => {
      const next = !prev;
      localStorage.setItem('rideprofit_show_cheatsheet', String(next));
      return next;
    });
  };

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

  // Dynamic calculation for Quick Fare Cheat-Sheet table
  const cheatSheetData = useMemo(() => {
    const distances = [
      { dist: 2, maxPickup: '0.5' },
      { dist: 5, maxPickup: '1.0' },
      { dist: 8, maxPickup: '1.5' },
      { dist: 10, maxPickup: '2.0' },
      { dist: 15, maxPickup: '2.5' },
      { dist: 20, maxPickup: '3.0' },
      { dist: 30, maxPickup: '3.5' },
    ];
    const { petrolPrice, kmPerLiter, maintenancePerKm, vehicleType } = settings;
    const runningCostPerKm = calcTotalCostPerKm(petrolPrice, kmPerLiter, maintenancePerKm);

    // Target profit margin: >= 25 LKR/km for motorbike, >= 35 LKR/km for three-wheeler or custom
    const isBike = vehicleType === 'motorbike';
    const marginPerKm = isBike ? 25 : 35;

    // Active commission rate and deduction
    const commRate = commission !== '' && !isNaN(parseFloat(commission))
      ? Math.max(0, parseFloat(commission))
      : (settings?.defaultCommission ?? 16);
    const ded = totalDeduction !== '' && !isNaN(parseFloat(totalDeduction))
      ? Math.max(0, parseFloat(totalDeduction))
      : (settings?.defaultDeduction ?? 0);
    const commDivisor = commRate < 100 ? (1 - commRate / 100) : 1;

    const rows = distances.map(({ dist, maxPickup }) => {
      // 1x trip: running cost for dist + target profit for dist
      const netNeededOneWay = (runningCostPerKm * dist) + (marginPerKm * dist);
      const minGrossOneWay = (netNeededOneWay + ded) / commDivisor;

      // 2x trip: running cost for 2x dist (empty return) + target profit for dist
      const netNeededReturn = (runningCostPerKm * (dist * 2)) + (marginPerKm * dist);
      const minGrossReturn = (netNeededReturn + ded) / commDivisor;

      return {
        dist,
        maxPickup,
        oneWay: Math.round(minGrossOneWay),
        emptyReturn: Math.round(minGrossReturn),
      };
    });

    return {
      runningCostPerKm,
      marginPerKm,
      commRate,
      ded,
      isBike,
      rows,
    };
  }, [settings, commission, totalDeduction]);

  const handleClear = () => {
    setFare('');
    setPickupDist('');
    setTripDist('');
    setCommission(String(settings?.defaultCommission ?? 16));
    setTotalDeduction(String(settings?.defaultDeduction ?? 0));
    setEmptyReturn(false);
    fareInputRef.current?.focus();
  };

  const setCommissionPreset = (val) => {
    setCommission(String(val));
  };

  const isModified = Boolean(
    fare ||
    tripDist ||
    pickupDist ||
    emptyReturn ||
    commission !== defaultCommission ||
    totalDeduction !== defaultDeduction
  );

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
        {isModified && (
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
              ref={fareInputRef}
              type="number"
              step="10"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  pickupInputRef.current?.focus();
                  pickupInputRef.current?.select();
                }
              }}
              enterKeyHint="next"
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
                ref={pickupInputRef}
                type="number"
                step="0.5"
                value={pickupDist}
                onChange={(e) => setPickupDist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    tripInputRef.current?.focus();
                    tripInputRef.current?.select();
                  }
                }}
                enterKeyHint="next"
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
                ref={tripInputRef}
                type="number"
                step="0.5"
                value={tripDist}
                onChange={(e) => setTripDist(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                  }
                }}
                enterKeyHint="done"
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-semibold"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                km
              </span>
            </div>
          </div>
        </div>

        {/* Deductions: App Commission (%) + Passenger Deduction (LKR) */}
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
                placeholder={defaultCommission}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                %
              </span>
            </div>
            {/* Quick Commission Presets */}
            <div className="flex items-center gap-1 mt-1.5">
              {[0, 10, 15, 16, 20].map((rate) => (
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

          {/* Passenger Deduction / Platform Fee (LKR) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 h-5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 truncate">
                <DollarSign className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{t.passengerDeduction || t.totalDeduction}</span>
              </label>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={totalDeduction}
                onChange={(e) => setTotalDeduction(e.target.value)}
                placeholder={defaultDeduction}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-semibold"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                LKR
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1.5 truncate">
              {t.passengerDeductionSub || t.totalDeductionSub}
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
                  <span className="text-slate-400">{t.passengerDeduction || t.totalDeduction}</span>
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

      {/* Quick Fare Cheat-Sheet Card (Collapsible) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        {/* Card Header (Collapsible Trigger) */}
        <button
          type="button"
          onClick={toggleCheatSheet}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 active:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Table className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">{t.cheatSheetTitle}</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded font-mono">
                  2 - 30 km
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{t.cheatSheetSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            {showCheatSheet ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {showCheatSheet && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-800/80 pt-3 animate-fade-in">
            {/* Live Assumptions Chips */}
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
              <span className="text-slate-300">
                {t.cheatRunningCost}: <span className="font-bold text-slate-200">{formatLKR(cheatSheetData.runningCostPerKm)}/km</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                {t.commission}: <span className="font-bold text-purple-400">{cheatSheetData.commRate}%</span>
              </span>
              {cheatSheetData.ded > 0 && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">
                    {t.passengerDeduction || t.totalDeduction}: <span className="font-bold text-amber-400">LKR {cheatSheetData.ded}</span>
                  </span>
                </>
              )}
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">
                {t.cheatTargetMargin}: <span className="font-bold text-emerald-400">+{cheatSheetData.marginPerKm}/km</span> ({cheatSheetData.isBike ? t.motorbike : t.threeWheeler})
              </span>
            </div>

            {/* 3-Column Table */}
            <div className="overflow-hidden rounded-xl border border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-950/90 text-slate-400 border-b border-slate-800 text-[11px]">
                    <th className="py-2.5 px-3 text-left font-bold">{t.cheatColDistance}</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-300">{t.cheatColOneWay}</th>
                    <th className="py-2.5 px-3 text-right font-bold text-amber-400">{t.cheatColEmptyReturn}</th>
                  </tr>
                </thead>
                <tbody>
                  {cheatSheetData.rows.map((row) => (
                    <tr
                      key={row.dist}
                      className="border-b border-slate-800/50 odd:bg-slate-950/40 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-2.5 px-3 align-middle">
                        <div className="font-mono font-bold text-slate-200 leading-tight">
                          {row.dist} km
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans tracking-tight mt-0.5 whitespace-nowrap">
                          ({(t.cheatPickupSub || 'Pickup < {km} km').replace('{km}', row.maxPickup)})
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-400 align-middle">
                        LKR {row.oneWay.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-right text-amber-400 bg-amber-500/5 align-middle">
                        LKR {row.emptyReturn.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Helper Note below table */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{t.cheatSheetNote}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
