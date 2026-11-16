import { useState, useMemo } from 'react';
import {
  Navigation, Route, Fuel, Wrench, Gauge, Banknote,
  CheckCircle2, AlertTriangle, RotateCcw,
  Sparkles, Car, ArrowRight
} from 'lucide-react';
import { calcTripCostDetails, formatLKR } from '../utils/calculations';

export default function TripCostTab({ t, settings }) {
  const [distance, setDistance] = useState('');
  const [isReturnTrip, setIsReturnTrip] = useState(false);

  // Live real-time trip calculation
  const tripDetails = useMemo(() => {
    const d = parseFloat(distance);
    if (!d || d <= 0) return null;
    return calcTripCostDetails({
      distance: d,
      isReturnTrip,
      settings,
    });
  }, [distance, isReturnTrip, settings]);

  const handleClear = () => {
    setDistance('');
    setIsReturnTrip(false);
  };

  const quickDistances = [2, 3, 5, 8, 12, 15, 20, 30];

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{t.tripCostTitle}</h2>
            <p className="text-[11px] text-slate-400">{t.tripCostSubtitle}</p>
          </div>
        </div>

        {distance && (
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
        {/* Planned Trip Distance */}
        <div>
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between mb-1.5">
            <span className="flex items-center gap-1.5">
              <Route className="w-4 h-4 text-sky-400" />
              {t.plannedDistance}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">One-Way KM</span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="0"
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-3 text-slate-100 placeholder-slate-600 font-mono text-xl font-bold focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 font-mono">
              km
            </span>
          </div>

          {/* Quick Distance Chips */}
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] text-slate-500 font-mono shrink-0">KM:</span>
            {quickDistances.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setDistance(String(km))}
                className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono transition-all shrink-0 ${
                  distance === String(km)
                    ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {km}km
              </button>
            ))}
          </div>
        </div>

        {/* Journey Type 2-Option Selector */}
        <div>
          <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
            {t.tripType}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIsReturnTrip(false)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                !isReturnTrip
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="block leading-tight">{t.oneWayTrip}</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">1x Running Cost</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReturnTrip(true)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                isReturnTrip
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="block leading-tight">{t.returnTrip}</span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">2x Running Cost</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Results */}
      {tripDetails ? (
        <div className="space-y-3.5 animate-slide-up">
          {/* Card 1: Estimated Net Profit Card (or Side-by-Side Comparison if Return Trip) */}
          {!isReturnTrip ? (
            /* Single Net Profit Card for One-Way Trip */
            <div
              className={`rounded-2xl p-4 text-center shadow-xl border relative overflow-hidden transition-all ${
                tripDetails.oneWayNetProfit >= 0
                  ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 border-emerald-500/50 text-white'
                  : 'bg-gradient-to-br from-rose-950 via-rose-900 to-slate-950 border-rose-500/50 text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1.5">
                {tripDetails.oneWayNetProfit >= 0 ? (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                )}
                <span className={`text-sm font-extrabold uppercase tracking-wide ${tripDetails.oneWayNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {t.netProfitCardTitle}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 mb-2">
                {tripDetails.oneWayNetProfit >= 0 ? t.profitableMeterMsg : t.lossMeterMsg}
              </p>

              <div className="my-2 py-2.5 bg-slate-950/70 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  {t.netProfit}
                </span>
                <p className={`text-3xl font-black font-mono tracking-tight ${tripDetails.oneWayNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatLKR(tripDetails.oneWayNetProfit)}
                </p>
                {tripDetails.oneWayMeterFare > 0 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs mt-1 font-mono">
                    <span className="text-slate-400">{t.profitMargin}:</span>
                    <span className={`font-bold ${tripDetails.oneWayNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {Math.round(tripDetails.oneWayProfitMargin)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Side-by-Side Comparison Card for Round Trip */
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {t.comparisonTitle}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono border border-slate-800">
                  2x Cost ({tripDetails.effectiveDistance.toFixed(1)} km)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Column 1: One-Way Fare (Customer pays 1x / Empty Return) */}
                <div
                  className={`rounded-xl p-3 border flex flex-col justify-between transition-all ${
                    tripDetails.emptyReturnNetProfit >= 0
                      ? 'bg-slate-950/80 border-emerald-500/40'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 h-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
                        {t.emptyReturnOption}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 ${
                          tripDetails.emptyReturnNetProfit >= 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {tripDetails.emptyReturnNetProfit >= 0 ? t.profitBadge : t.lossBadge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mb-2.5 h-7 line-clamp-2">
                      {t.emptyReturnOptionSub}
                    </p>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                        <span className="text-[11px] text-slate-400 font-sans">{t.fareCharged}</span>
                        <span className="font-bold text-slate-200">{formatLKR(tripDetails.oneWayMeterFare)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                        <span className="text-[11px] text-slate-400 font-sans">{t.totalCost}</span>
                        <span className="font-semibold text-rose-400">-{formatLKR(tripDetails.totalRunningCost)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 bg-slate-950/60 rounded-lg p-2 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">
                      {t.netResult}
                    </span>
                    <p
                      className={`text-base font-black font-mono tracking-tight ${
                        tripDetails.emptyReturnNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatLKR(tripDetails.emptyReturnNetProfit)}
                    </p>
                    <span
                      className={`text-[10px] font-mono font-bold block ${
                        tripDetails.emptyReturnNetProfit >= 0 ? 'text-emerald-300/80' : 'text-rose-300/80'
                      }`}
                    >
                      {Math.round(tripDetails.emptyReturnMargin)}% margin
                    </span>
                  </div>
                </div>

                {/* Column 2: Round-Trip Fare (Customer pays 2x) */}
                <div
                  className={`rounded-xl p-3 border flex flex-col justify-between transition-all ${
                    tripDetails.roundTripNetProfit >= 0
                      ? 'bg-emerald-950/30 border-emerald-500/50'
                      : 'bg-rose-950/30 border-rose-500/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1 h-5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 truncate">
                        {t.roundTripOption}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ml-1 ${
                          tripDetails.roundTripNetProfit >= 0
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {tripDetails.roundTripNetProfit >= 0 ? t.profitBadge : t.lossBadge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mb-2.5 h-7 line-clamp-2">
                      {t.roundTripOptionSub}
                    </p>

                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                        <span className="text-[11px] text-slate-400 font-sans">{t.fareCharged}</span>
                        <span className="font-bold text-amber-400">{formatLKR(tripDetails.roundTripMeterFare)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0.5 border-b border-slate-800/60">
                        <span className="text-[11px] text-slate-400 font-sans">{t.totalCost}</span>
                        <span className="font-semibold text-rose-400">-{formatLKR(tripDetails.totalRunningCost)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-emerald-500/20 bg-slate-950/60 rounded-lg p-2 text-center">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-sans">
                      {t.netResult}
                    </span>
                    <p
                      className={`text-base font-black font-mono tracking-tight ${
                        tripDetails.roundTripNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatLKR(tripDetails.roundTripNetProfit)}
                    </p>
                    <span
                      className={`text-[10px] font-mono font-bold block ${
                        tripDetails.roundTripNetProfit >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {Math.round(tripDetails.roundTripMargin)}% margin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Actual Vehicle Running Cost Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-400" />
                {t.vehicleCostCardTitle}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-mono border border-slate-800">
                {tripDetails.effectiveDistance.toFixed(1)} km total
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Route className="w-3.5 h-3.5 text-sky-400" />
                  {t.totalEffectiveDist}
                </span>
                <span className="font-mono font-bold text-sky-300">
                  {tripDetails.effectiveDistance.toFixed(1)} km
                  {isReturnTrip && <span className="text-[10px] text-slate-500 font-normal ml-1">(2x trip)</span>}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  {t.fuelNeeded} ({settings.kmPerLiter || 22} km/L)
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {tripDetails.fuelLiters.toFixed(2)} {t.liters}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  {t.totalFuelCost} (@ LKR {settings.petrolPrice || 320}/L)
                </span>
                <span className="font-mono font-semibold text-amber-400">
                  -{formatLKR(tripDetails.totalFuelCost)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-sky-400" />
                  {t.totalMaintCost} (@ LKR {settings.maintenancePerKm || 4.5}/km)
                </span>
                <span className="font-mono font-semibold text-sky-400">
                  -{formatLKR(tripDetails.totalMaintenanceCost)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1.5">
                <span className="text-rose-400 font-bold">{t.breakEvenCost}</span>
                <span className="font-mono font-black text-rose-400 text-sm">
                  {formatLKR(tripDetails.totalRunningCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Standard Meter Taxi Fare Calculation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                {t.meterFareCardTitle}
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {settings.vehicleType === 'threeWheeler' ? 'Three-Wheeler' : 'Motorbike'}
              </span>
            </div>

            {/* Formula Preview Box */}
            <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 text-[11px] mb-3 text-slate-400 font-mono">
              <span className="text-slate-500 block text-[10px] mb-0.5">Rate Schedule:</span>
              <span>1st KM: <strong>LKR {settings.firstKmFare ?? 100}</strong></span>
              <span className="mx-1.5 text-slate-600">•</span>
              <span>After: <strong>LKR {settings.secondKmRate ?? 85}/km</strong></span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">{t.oneWayFare} ({tripDetails.oneWayDistance.toFixed(1)} km)</span>
                <span className="font-mono font-bold text-slate-200">
                  {formatLKR(tripDetails.oneWayMeterFare)}
                </span>
              </div>

              {isReturnTrip && (
                <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">{t.roundTripFare} ({tripDetails.effectiveDistance.toFixed(1)} km)</span>
                  <span className="font-mono font-bold text-amber-400">
                    {formatLKR(tripDetails.roundTripMeterFare)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <div>
                  <span className="text-amber-400 font-bold block">{t.meterFareSub}</span>
                  <span className="text-[10px] text-slate-500">
                    {isReturnTrip ? '1x vs 2x fare shown above' : 'Standard 1x passenger fare'}
                  </span>
                </div>
                <span className="font-mono font-black text-amber-400 text-lg">
                  {formatLKR(isReturnTrip ? tripDetails.roundTripMeterFare : tripDetails.oneWayMeterFare)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Quick Instructions */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3">
            <Navigation className="w-6 h-6 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mb-1">{t.tripCostPlaceholderTitle}</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t.tripCostPlaceholder}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
            <span>⛽ Fuel Liters</span>
            <span>•</span>
            <span>🔧 Running Cost</span>
            <span>•</span>
            <span>🚕 Meter Fare</span>
          </div>
        </div>
      )}
    </div>
  );
}
