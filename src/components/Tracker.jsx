import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Plus, Trash2, RotateCcw, MapPin, Banknote,
  Fuel, Wrench, Route, Target, ToggleLeft, ToggleRight,
  ChevronRight, Calculator, Calendar, History, ChevronDown,
  ChevronUp, CheckCircle2, AlertCircle, ArrowUpRight, Gauge
} from 'lucide-react';
import {
  calcHireProfit, calcBulkProfit, aggregateHires, formatLKR,
  getTodayKey, registerDateInIndex, getTrackedDates, getMonthlySummary,
  deleteDateFromHistory, HIRES_KEY_PREFIX, BULK_KEY_PREFIX
} from '../utils/calculations';

function loadHiresForDate(dateKey) {
  try {
    const saved = localStorage.getItem(HIRES_KEY_PREFIX + dateKey);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load hires for date:', e);
  }
  return [];
}

function saveHiresForDate(dateKey, hires) {
  try {
    localStorage.setItem(HIRES_KEY_PREFIX + dateKey, JSON.stringify(hires));
    registerDateInIndex(dateKey);
  } catch (e) {
    console.error('Failed to save hires:', e);
  }
}

export default function TrackerTab({ t, settings }) {
  const [activeDate, setActiveDate] = useState(getTodayKey);
  const [mode, setMode] = useState('individual'); // 'individual' | 'bulk'
  const [hires, setHires] = useState(() => loadHiresForDate(getTodayKey()));

  // Sub-mode A: Individual Hire state
  const [hireType, setHireType] = useState('app'); // 'app' | 'road'
  const [earnings, setEarnings] = useState('');
  const [distance, setDistance] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  // Sub-mode B: Bulk / EOD state
  const [bulkAppEarnings, setBulkAppEarnings] = useState('');
  const [bulkCash, setBulkCash] = useState('');
  const [distInputMode, setDistInputMode] = useState('direct'); // 'direct' | 'odometer'
  const [bulkDistance, setBulkDistance] = useState('');
  const [startOdo, setStartOdo] = useState('');
  const [endOdo, setEndOdo] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  // History & Collapsible section state
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);

  // Load hires when activeDate changes
  useEffect(() => {
    setHires(loadHiresForDate(activeDate));
    // Load any bulk saved result for this date
    try {
      const savedBulk = localStorage.getItem(BULK_KEY_PREFIX + activeDate);
      if (savedBulk) {
        setBulkResult(JSON.parse(savedBulk));
      } else {
        setBulkResult(null);
      }
    } catch (e) {
      setBulkResult(null);
    }
  }, [activeDate, historyVersion]);

  // Save hires whenever they change
  useEffect(() => {
    saveHiresForDate(activeDate, hires);
  }, [hires, activeDate]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // Summary calculation for the active date
  const summary = useMemo(() => aggregateHires(hires), [hires]);

  // Target calculations
  const dailyTarget = settings.dailyTarget || 0;
  const targetProgress = dailyTarget > 0 ? (summary.totalNetProfit / dailyTarget) * 100 : 0;
  const targetRemaining = dailyTarget > 0 ? Math.max(0, dailyTarget - summary.totalNetProfit) : 0;
  const targetExceeded = dailyTarget > 0 && summary.totalNetProfit > dailyTarget ? summary.totalNetProfit - dailyTarget : 0;

  // Monthly summary & Last 7 Days records
  const monthlySummary = useMemo(() => getMonthlySummary(), [hires, bulkResult, historyVersion]);
  const trackedDates = useMemo(() => getTrackedDates(), [hires, activeDate, historyVersion]);
  const past7Days = useMemo(() => trackedDates.slice(0, 7), [trackedDates]);

  // Delete an entire day's records
  const handleDeleteDay = (dateStr) => {
    const isToday = dateStr === getTodayKey();
    const promptMsg = `${t.deleteDayConfirm || 'Are you sure you want to delete records for'} ${isToday ? `${t.today} (${dateStr})` : dateStr}?`;
    if (window.confirm(promptMsg)) {
      deleteDateFromHistory(dateStr);
      if (activeDate === dateStr) {
        const today = getTodayKey();
        setActiveDate(today);
        setHires(loadHiresForDate(today));
        setBulkResult(null);
      }
      setHistoryVersion((v) => v + 1);
      showToast(t.dayDeleted || 'Day records deleted');
    }
  };

  // Calculate live odometer distance if in odometer mode
  const calculatedOdoDistance = useMemo(() => {
    const s = parseFloat(startOdo);
    const e = parseFloat(endOdo);
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      return (e - s).toFixed(1);
    }
    return '';
  }, [startOdo, endOdo]);

  // Handle adding an individual hire
  const handleAddHire = () => {
    const dist = parseFloat(distance);
    const amt = parseFloat(earnings);

    if (!dist || dist <= 0 || !amt || amt <= 0) {
      showToast(t.fillAllFields);
      return;
    }

    const hire = calcHireProfit({
      earnings: amt,
      tripDistance: dist,
      isRoundTrip,
      settings,
      hireType,
      commissionRate: settings?.defaultCommission ?? 16,
    });

    hire.id = Date.now();
    hire.time = new Date().toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });

    setHires((prev) => [...prev, hire]);
    setEarnings('');
    setDistance('');
    setIsRoundTrip(false);
    showToast(t.hireAdded);
  };

  const handleDeleteHire = (id) => {
    setHires((prev) => prev.filter((h) => h.id !== id));
  };

  const handleResetDay = () => {
    if (window.confirm(t.resetConfirm)) {
      setHires([]);
      try {
        localStorage.removeItem(BULK_KEY_PREFIX + activeDate);
        setBulkResult(null);
      } catch (e) {}
      showToast('Day reset successfully');
    }
  };

  const handleCalculateBulk = () => {
    const appE = parseFloat(bulkAppEarnings) || 0;
    const cash = parseFloat(bulkCash) || 0;
    const dist = distInputMode === 'odometer' ? parseFloat(calculatedOdoDistance) : parseFloat(bulkDistance);

    if (!dist || dist <= 0) {
      showToast(t.fillAllFields);
      return;
    }

    const result = calcBulkProfit(appE, cash, dist, settings);
    setBulkResult(result);

    // Save to localStorage for this date
    try {
      localStorage.setItem(BULK_KEY_PREFIX + activeDate, JSON.stringify(result));
      registerDateInIndex(activeDate);
      showToast(t.savedToHistory);
    } catch (e) {
      console.error(e);
    }
  };

  const isToday = activeDate === getTodayKey();

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Title & Date Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{t.trackerTitle}</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{t.activeDate}</span>
              <span className="font-mono font-semibold text-emerald-400">
                {isToday ? `${t.today} (${activeDate})` : activeDate}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector Dropdown or Reset to Today */}
        {!isToday && (
          <button
            type="button"
            onClick={() => setActiveDate(getTodayKey())}
            className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-lg font-semibold active:scale-95 transition-all"
          >
            ← {t.today}
          </button>
        )}
      </div>

      {/* Main Dashboard Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t.summaryTitle}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {hires.length} {t.trips}
          </span>
        </div>

        {/* Net Profit Big Display */}
        <div className="my-2">
          <span className="text-[11px] text-slate-400 font-medium block">{t.netProfit}</span>
          <div className={`text-3xl font-black font-mono tracking-tight ${summary.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatLKR(summary.totalNetProfit)}
          </div>
        </div>

        {/* Breakdown Metric Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">{t.appEarnings}</span>
            <span className="font-mono font-bold text-slate-100">{formatLKR(summary.totalEarnings)}</span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">{t.totalDistance}</span>
            <span className="font-mono font-bold text-sky-400">
              {summary.totalEffectiveDistance.toFixed(1)} km
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">{t.totalFuelCost}</span>
            <span className="font-mono font-bold text-amber-400">
              -{formatLKR(summary.totalFuelCost)}
            </span>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/60">
            <span className="text-[10px] text-slate-400 block mb-0.5">{t.totalMaintCost}</span>
            <span className="font-mono font-bold text-rose-400">
              -{formatLKR(summary.totalMaintenanceCost)}
            </span>
          </div>
        </div>

        {/* Daily Leasing / Target Progress Bar */}
        {dailyTarget > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1 font-medium">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                {t.dailyProgress}
              </span>
              <span className="font-mono font-bold text-slate-200">
                {Math.round(Math.min(100, Math.max(0, targetProgress)))}%
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 p-0.5 border border-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  targetProgress >= 100
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-sm shadow-emerald-400/50'
                    : 'bg-gradient-to-r from-amber-500 to-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, targetProgress))}%` }}
              />
            </div>

            {/* Target Status Labels */}
            <div className="flex justify-between items-center text-[10px] mt-1.5 font-mono">
              <span className="text-slate-400">
                {formatLKR(summary.totalNetProfit)} / {formatLKR(dailyTarget)}
              </span>
              {targetProgress >= 100 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {targetExceeded > 0 ? `+${formatLKR(targetExceeded)}` : t.targetReached}
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">
                  {t.targetRemaining} {formatLKR(targetRemaining)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sub-mode Tab Selector: Individual vs End-of-Day Bulk */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
        <button
          type="button"
          onClick={() => setMode('individual')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mode === 'individual'
              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.modeIndividual}
        </button>
        <button
          type="button"
          onClick={() => setMode('bulk')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
            mode === 'bulk'
              ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.modeBulk}
        </button>
      </div>

      {/* Mode A: Individual Hires */}
      {mode === 'individual' ? (
        <div className="space-y-4">
          {/* Add Hire Input Form */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg shadow-black/20">
            {/* Hire Type Switch: App vs Road Pickup */}
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                {t.hireType}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setHireType('app')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    hireType === 'app'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  📱 {t.typeApp}
                </button>
                <button
                  type="button"
                  onClick={() => setHireType('road')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    hireType === 'road'
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  💵 {t.typeRoad}
                </button>
              </div>
            </div>

            {/* Fare Input (Direct Your Earnings) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  {t.hireEarnings}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {hireType === 'app' ? 'PickMe / Uber Net' : 'Cash 100%'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10"
                  value={earnings}
                  onChange={(e) => setEarnings(e.target.value)}
                  placeholder="e.g. 520"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 font-mono text-base font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  LKR
                </span>
              </div>
            </div>

            {/* Trip Distance */}
            <div>
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-sky-400" />
                {t.hireDistance}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g. 4.5"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 font-mono text-base font-semibold focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  km
                </span>
              </div>
            </div>

            {/* Empty Return Toggle Switch */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsRoundTrip(!isRoundTrip)}
              onKeyDown={(e) => e.key === 'Enter' && setIsRoundTrip(!isRoundTrip)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                isRoundTrip
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs font-bold leading-tight flex items-center gap-1">
                  <span>{t.roundTrip}</span>
                  {isRoundTrip && (
                    <span className="text-[10px] bg-amber-500/20 px-1 rounded font-mono">2x KM</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t.roundTripDesc}</p>
              </div>
              {isRoundTrip ? (
                <ToggleRight className="w-7 h-7 text-amber-400 shrink-0" />
              ) : (
                <ToggleLeft className="w-7 h-7 text-slate-600 shrink-0" />
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleAddHire}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              {t.addHire}
            </button>
          </div>

          {/* Today's Logged Trips List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.hire} ({hires.length})
              </h3>
              {hires.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetDay}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t.resetDay}
                </button>
              )}
            </div>

            {hires.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
                <Route className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  {t.noHires}
                </p>
              </div>
            ) : (
              hires
                .slice()
                .reverse()
                .map((hire, idx) => (
                  <div
                    key={hire.id}
                    className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-slate-700 transition-all"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          #{hires.length - idx}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{hire.time}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                          hire.hireType === 'road'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {hire.hireType === 'road' ? 'Road 0%' : 'App'}
                        </span>
                        {hire.isRoundTrip && (
                          <span className="text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded-full">
                            {t.emptyReturn}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-300 font-mono font-medium">
                          {hire.effectiveDistance.toFixed(1)} km
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400 font-mono">
                          Fare: {formatLKR(hire.earnings)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <span className={`text-xs font-black font-mono block ${hire.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {hire.netProfit >= 0 ? '+' : ''}{formatLKR(hire.netProfit)}
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold">
                          {t.profit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHire(hire.id)}
                        aria-label="Delete entry"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      ) : (
        /* Mode B: End-of-Day Bulk / Odometer Calculator */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg shadow-black/20">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-purple-400" />
              {t.bulkTitle}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{t.bulkDesc}</p>
          </div>

          {/* Earnings inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                App Total (LKR)
              </label>
              <input
                type="number"
                step="50"
                value={bulkAppEarnings}
                onChange={(e) => setBulkAppEarnings(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-1">
                <Banknote className="w-3.5 h-3.5 text-amber-400" />
                Cash Pickups (LKR)
              </label>
              <input
                type="number"
                step="50"
                value={bulkCash}
                onChange={(e) => setBulkCash(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Distance Calculation Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-purple-400" />
                {t.odometerMode}
              </label>
              <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDistInputMode('direct')}
                  className={`px-2 py-0.5 rounded font-medium ${distInputMode === 'direct' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-500'}`}
                >
                  Direct KM
                </button>
                <button
                  type="button"
                  onClick={() => setDistInputMode('odometer')}
                  className={`px-2 py-0.5 rounded font-medium ${distInputMode === 'odometer' ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-500'}`}
                >
                  Odometer Readings
                </button>
              </div>
            </div>

            {distInputMode === 'direct' ? (
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={bulkDistance}
                  onChange={(e) => setBulkDistance(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 font-mono text-sm focus:border-purple-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  km
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">{t.startOdo}</span>
                  <input
                    type="number"
                    value={startOdo}
                    onChange={(e) => setStartOdo(e.target.value)}
                    placeholder="e.g. 42100"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">{t.endOdo}</span>
                  <input
                    type="number"
                    value={endOdo}
                    onChange={(e) => setEndOdo(e.target.value)}
                    placeholder="e.g. 42195"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:border-purple-500 outline-none"
                  />
                </div>
                {calculatedOdoDistance && (
                  <div className="col-span-2 text-right text-xs font-mono text-sky-400">
                    Driven: <span className="font-bold">{calculatedOdoDistance} km</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCalculateBulk}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 text-sm"
          >
            <Calculator className="w-4 h-4" />
            {t.calculateDay}
          </button>

          {/* Bulk Breakdown Card */}
          {bulkResult && (
            <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3.5 space-y-2 text-xs animate-slide-up">
              <span className="text-[10px] text-purple-300 uppercase tracking-wider font-bold block">
                {t.bulkResult}
              </span>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">{t.grossEarnings}</span>
                <span className="font-mono font-bold text-slate-100">{formatLKR(bulkResult.grossEarnings)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">{t.totalFuelCost}</span>
                <span className="font-mono font-bold text-amber-400">-{formatLKR(bulkResult.fuelCost)}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">{t.totalMaintCost}</span>
                <span className="font-mono font-bold text-sky-400">-{formatLKR(bulkResult.maintenanceCost)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-emerald-400 font-bold">{t.netProfit}</span>
                <span className={`text-base font-black font-mono ${bulkResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatLKR(bulkResult.netProfit)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Days History & Monthly Summary Collapsible Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <History className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
                {t.historyTitle}
              </h3>
              <p className="text-[10px] text-slate-400">{t.historySubtitle}</p>
            </div>
          </div>
          {showHistory ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showHistory && (
          <div className="p-4 pt-0 space-y-3 border-t border-slate-800/60 animate-fade-in">
            {/* Monthly Profit Highlight Box */}
            <div className="bg-gradient-to-r from-emerald-950/70 to-slate-950 border border-emerald-500/30 rounded-xl p-3 text-center my-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                {t.monthlySummaryTitle} ({monthlySummary.currentMonthLabel})
              </span>
              <p className="text-2xl font-black font-mono text-emerald-400 my-0.5">
                {formatLKR(monthlySummary.monthlyNetProfit)}
              </p>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                <div>
                  <span className="block text-slate-500">{t.monthlyEarnings}</span>
                  <span className="font-mono font-bold text-slate-200">{formatLKR(monthlySummary.monthlyEarnings)}</span>
                </div>
                <div>
                  <span className="block text-slate-500">{t.monthlyDistance}</span>
                  <span className="font-mono font-bold text-sky-300">{monthlySummary.monthlyDistance.toFixed(0)} km</span>
                </div>
                <div>
                  <span className="block text-slate-500">{t.monthlyTrips}</span>
                  <span className="font-mono font-bold text-slate-200">{monthlySummary.monthlyTrips}</span>
                </div>
              </div>
            </div>

            {/* List of Tracked Dates (Limited to Last 7 Days) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {t.records}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {past7Days.length} / 7 days
                </span>
              </div>
              {past7Days.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">{t.noHistory}</p>
              ) : (
                past7Days.map((dateStr) => {
                  const dayHires = loadHiresForDate(dateStr);
                  const daySummary = aggregateHires(dayHires);
                  const isCurrent = dateStr === activeDate;

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setActiveDate(dateStr)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-xs font-mono font-semibold block leading-tight truncate">
                            {dateStr === getTodayKey() ? `${t.today} (${dateStr})` : dateStr}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate block">
                            {dayHires.length} {t.trips} • {daySummary.totalEffectiveDistance.toFixed(1)} km
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2 shrink-0">
                        <div>
                          <span className={`text-xs font-bold font-mono block ${daySummary.totalNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {formatLKR(daySummary.totalNetProfit)}
                          </span>
                          <span className="text-[9px] text-slate-500">Net Profit</span>
                        </div>

                        {/* Delete Day Action */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDay(dateStr);
                          }}
                          title={t.deleteHire || 'Delete'}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg active:scale-95 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
