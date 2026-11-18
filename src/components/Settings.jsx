import { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon, Bike, Car, Wrench, Save, RotateCcw,
  Fuel, DollarSign, Target, CheckCircle2, Sparkles, Gauge, Percent,
  Download, Upload, FileSpreadsheet, Database, RefreshCw
} from 'lucide-react';
import {
  calcFuelCostPerKm,
  calcTotalCostPerKm,
  PRESETS,
  DEFAULT_SETTINGS,
  exportAllDataToCSV,
  exportFullBackupJSON,
  restoreFullBackupJSON
} from '../utils/calculations';

const STORAGE_KEY = 'rideprofit_settings_v1';

export function loadSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const isThreeWheeler = parsed.vehicleType === 'threeWheeler';
      return {
        ...DEFAULT_SETTINGS,
        firstKmFare: isThreeWheeler ? 100 : 75,
        secondKmRate: isThreeWheeler ? 85 : 55,
        waitingRatePerMin: isThreeWheeler ? 5 : 4,
        targetMode: 'simple',
        dailyTarget: 4040,
        monthlyFixedExpenses: 71000,
        monthlyFoodExpenses: 30000,
        workingDaysPerMonth: 25,
        serviceReservePerKm: 2,
        defaultCommission: 16,
        defaultDeduction: 0,
        serviceInterval: isThreeWheeler ? 3000 : 2500,
        kmSinceService: 0,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export default function SettingsTab({ t, settings, setSettings }) {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const fuelCostPerKm = calcFuelCostPerKm(localSettings.petrolPrice, localSettings.kmPerLiter);
  const totalCostPerKm = calcTotalCostPerKm(localSettings.petrolPrice, localSettings.kmPerLiter, localSettings.maintenancePerKm);

  const activeTargetMode = localSettings.targetMode || 'simple';
  const workingDays = Math.max(1, parseFloat(localSettings.workingDaysPerMonth) || 25);
  const dailyFixedPreview = Math.round((parseFloat(localSettings.monthlyFixedExpenses) || 0) / workingDays);
  const dailyFoodPreview = Math.round((parseFloat(localSettings.monthlyFoodExpenses) || 0) / workingDays);
  const dailyTotalPreview = dailyFixedPreview + dailyFoodPreview;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handlePreset = (type) => {
    const preset = PRESETS[type];
    if (preset) {
      const updated = {
        ...localSettings,
        vehicleType: preset.vehicleType,
        kmPerLiter: preset.kmPerLiter,
        petrolPrice: preset.petrolPrice,
        maintenancePerKm: preset.maintenancePerKm,
        targetMode: localSettings.targetMode ?? 'simple',
        dailyTarget: localSettings.dailyTarget ?? 4040,
        monthlyFixedExpenses: localSettings.monthlyFixedExpenses ?? 71000,
        monthlyFoodExpenses: localSettings.monthlyFoodExpenses ?? 30000,
        workingDaysPerMonth: localSettings.workingDaysPerMonth ?? 25,
        serviceReservePerKm: localSettings.serviceReservePerKm ?? 2,
        firstKmFare: preset.firstKmFare,
        secondKmRate: preset.secondKmRate,
        waitingRatePerMin: preset.waitingRatePerMin ?? (type === 'threeWheeler' ? 5 : 4),
        defaultCommission: localSettings.defaultCommission ?? 16,
        defaultDeduction: localSettings.defaultDeduction ?? 0,
        serviceInterval: preset.serviceInterval || localSettings.serviceInterval || 2500,
        kmSinceService: localSettings.kmSinceService ?? 0,
      };
      setLocalSettings(updated);
      showToast(`${t[type] || type} Preset Applied`);
    }
  };

  const handleSave = () => {
    saveSettings(localSettings);
    setSettings(localSettings);
    showToast(t.settingsSaved);
  };

  const handleReset = () => {
    if (window.confirm(t.resetConfirm || 'Reset settings to default?')) {
      const defaults = { ...DEFAULT_SETTINGS };
      setLocalSettings(defaults);
      saveSettings(defaults);
      setSettings(defaults);
      showToast(t.settingsReset);
    }
  };

  const updateField = (field, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleExportCsv = () => {
    try {
      const csv = exportAllDataToCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rideprofit_trips_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t.csvExported);
    } catch (e) {
      console.error(e);
      showToast('Export failed');
    }
  };

  const handleBackupJson = () => {
    try {
      const backup = exportFullBackupJSON();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rideprofit_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(t.dataBackupDownloaded);
    } catch (e) {
      console.error(e);
      showToast('Backup failed');
    }
  };

  const handleFileRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        const success = restoreFullBackupJSON(content);
        if (success) {
          const reloaded = loadSettings();
          setLocalSettings(reloaded);
          setSettings(reloaded);
          showToast(t.dataRestored);
        } else {
          showToast(t.invalidBackupFile);
        }
      } catch (err) {
        console.error(err);
        showToast(t.invalidBackupFile);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <SettingsIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-tight">{t.settingsTitle}</h2>
            <p className="text-[11px] text-slate-400">Configure vehicle specs for accurate profit math</p>
          </div>
        </div>
      </div>

      {/* Vehicle Preset Selector (2 Cards: Motorbike & Three-Wheeler) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-black/20">
        <label className="text-xs font-bold text-slate-300 block mb-2.5 uppercase tracking-wider">
          {t.vehiclePreset}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handlePreset('motorbike')}
            className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all ${
              localSettings.vehicleType === 'motorbike'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Bike className="w-7 h-7 stroke-[2]" />
            <span className="text-xs font-semibold leading-tight text-center">{t.motorbike}</span>
            <span className="text-[11px] font-mono text-emerald-400/80 font-bold">47 km/L</span>
          </button>

          <button
            type="button"
            onClick={() => handlePreset('threeWheeler')}
            className={`flex flex-col items-center gap-1.5 p-3.5 rounded-xl border transition-all ${
              localSettings.vehicleType === 'threeWheeler'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-500/10'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Car className="w-7 h-7 stroke-[2]" />
            <span className="text-xs font-semibold leading-tight text-center">{t.threeWheeler}</span>
            <span className="text-[11px] font-mono text-emerald-400/80 font-bold">22 km/L</span>
          </button>
        </div>
      </div>

      {/* Live Cost Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Cost Metric</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
            Auto-Updated
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 text-center">
            <p className="text-[11px] text-slate-400 mb-1 flex items-center justify-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-amber-400" />
              {t.fuelCostPerKm}
            </p>
            <p className="text-xl font-extrabold text-amber-400 font-mono">
              {fuelCostPerKm.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.lkrPerKm}</p>
          </div>

          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3 text-center">
            <p className="text-[11px] text-emerald-400 mb-1 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              {t.totalRunningCost}
            </p>
            <p className="text-xl font-extrabold text-emerald-400 font-mono">
              {totalCostPerKm.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.lkrPerKm}</p>
          </div>
        </div>
      </div>

      {/* Input Fields (Fully Editable) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        {/* Fuel Efficiency */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Fuel className="w-4 h-4 text-emerald-400" />
            {t.fuelEfficiency}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.5"
              value={localSettings.kmPerLiter || ''}
              onChange={(e) => updateField('kmPerLiter', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
              placeholder="e.g. 47"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
              km/L
            </span>
          </div>
        </div>

        {/* Petrol Price - Clean numeric input */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-4 h-4 text-amber-400" />
            {t.petrolPrice}
          </label>
          <div className="relative">
            <input
              type="number"
              step="1"
              value={localSettings.petrolPrice || ''}
              onChange={(e) => updateField('petrolPrice', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono"
              placeholder="e.g. 320"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
              LKR/L
            </span>
          </div>
        </div>

        {/* Maintenance Cost */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Wrench className="w-4 h-4 text-sky-400" />
            {t.maintenanceCost}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.25"
              value={localSettings.maintenancePerKm || ''}
              onChange={(e) => updateField('maintenancePerKm', parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-mono"
              placeholder="e.g. 4.00"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
              LKR/km
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Covers engine oil, tire wear, brake pads, and general vehicle servicing.
          </p>
        </div>
      </div>

      {/* Unified Daily Goal & Expense Planner Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              {t.goalPlannerTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.goalPlannerSub}</p>
          </div>
        </div>

        {/* 2-Mode Segmented Toggle: Simple Daily Target | Monthly Budget Split */}
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => updateField('targetMode', 'simple')}
            className={`flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap text-center ${
              activeTargetMode === 'simple'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.targetModeSimple}
          </button>
          <button
            type="button"
            onClick={() => updateField('targetMode', 'monthly')}
            className={`flex-1 py-2 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap text-center ${
              activeTargetMode === 'monthly'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.targetModeMonthly}
          </button>
        </div>

        {activeTargetMode === 'simple' ? (
          /* Mode 1: Simple Daily Net Profit Target */
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Target className="w-4 h-4 text-purple-400" />
              {t.dailyNetProfitTarget}
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                min="0"
                value={localSettings.dailyTarget ?? ''}
                onChange={(e) => updateField('dailyTarget', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono"
                placeholder="4040"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                LKR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{t.dailyTargetHideHint}</p>
          </div>
        ) : (
          /* Mode 2: Monthly Budget Split */
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 1. Monthly Fixed Expenses */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.monthlyFixedExpenses}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={localSettings.monthlyFixedExpenses ?? ''}
                    onChange={(e) => updateField('monthlyFixedExpenses', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono"
                    placeholder="71000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    LKR
                  </span>
                </div>
              </div>

              {/* 2. Monthly Food & Living */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.monthlyFoodExpenses}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={localSettings.monthlyFoodExpenses ?? ''}
                    onChange={(e) => updateField('monthlyFoodExpenses', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono"
                    placeholder="30000"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    LKR
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 3. Working Days / Month + Quick Pills */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.workingDaysPerMonth}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="31"
                    value={localSettings.workingDaysPerMonth ?? ''}
                    onChange={(e) => updateField('workingDaysPerMonth', Math.max(1, Math.min(31, parseFloat(e.target.value) || 1)))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all font-mono"
                    placeholder="25"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    {t.daysUnit}
                  </span>
                </div>
                {/* Quick Working Days Pills */}
                <div className="grid grid-cols-5 gap-1 mt-1.5">
                  {[20, 22, 25, 26, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => updateField('workingDaysPerMonth', d)}
                      className={`text-[11px] py-1 rounded-lg border font-mono font-bold transition-all text-center ${
                        Number(localSettings.workingDaysPerMonth) === d
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Service Reserve (LKR/km) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.serviceReservePerKm}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={localSettings.serviceReservePerKm ?? ''}
                    onChange={(e) => updateField('serviceReservePerKm', e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all font-mono"
                    placeholder="2"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    LKR/km
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Live Daily Goals Summary Pill */}
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-center">
              <p className="text-[11px] sm:text-xs font-mono text-slate-300 leading-relaxed">
                <span className="text-slate-400 font-sans font-semibold mr-1">{t.dailyGoalsSummaryPrefix}</span>
                <span className="text-purple-300 font-bold">{t.fixedShort} LKR {dailyFixedPreview.toLocaleString('en-US')}</span>
                <span className="text-slate-500 mx-1">+</span>
                <span className="text-amber-300 font-bold">{t.foodShort} LKR {dailyFoodPreview.toLocaleString('en-US')}</span>
                <span className="text-slate-500 mx-1">=</span>
                <span className="text-emerald-400 font-black">LKR {dailyTotalPreview.toLocaleString('en-US')}{t.perDaySuffix}</span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Meter Fare Rates Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Gauge className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              {t.meterRatesTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.meterRatesSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* 1st KM Base Fare */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.firstKmFare}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                value={localSettings.firstKmFare ?? ''}
                onChange={(e) => updateField('firstKmFare', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono"
                placeholder={localSettings.vehicleType === 'threeWheeler' ? '100' : '75'}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                LKR
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {localSettings.vehicleType === 'threeWheeler' ? 'Default: 100 LKR' : 'Default: 75 LKR'}
            </p>
          </div>

          {/* 2nd KM Onwards Rate */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.secondKmRate}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="5"
                value={localSettings.secondKmRate ?? ''}
                onChange={(e) => updateField('secondKmRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono"
                placeholder={localSettings.vehicleType === 'threeWheeler' ? '85' : '55'}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                LKR/km
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {localSettings.vehicleType === 'threeWheeler' ? 'Default: 85 LKR/km' : 'Default: 55 LKR/km'}
            </p>
          </div>

          {/* Waiting Charge per Minute */}
          <div className="col-span-2 sm:col-span-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.waitingRatePerMin}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={localSettings.waitingRatePerMin ?? ''}
                onChange={(e) => updateField('waitingRatePerMin', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all font-mono"
                placeholder={localSettings.vehicleType === 'threeWheeler' ? '5' : '4'}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                LKR/min
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {localSettings.vehicleType === 'threeWheeler' ? 'Default: 5 LKR/min' : 'Default: 4 LKR/min'}
            </p>
          </div>
        </div>
      </div>

      {/* App Commission & Platform Fee Configuration */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              {t.appFeeSettingsTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.appFeeSettingsSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Default App Commission (%) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.defaultCommission}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={localSettings.defaultCommission ?? ''}
                onChange={(e) => updateField('defaultCommission', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono"
                placeholder="16"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                %
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {t.defaultCommissionHint}
            </p>
          </div>

          {/* Default Passenger Deduction / Platform Fee (LKR) */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.defaultPassengerDeduction}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                value={localSettings.defaultDeduction ?? ''}
                onChange={(e) => updateField('defaultDeduction', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono"
                placeholder="0"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                LKR
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {t.defaultPassengerDeductionHint}
            </p>
          </div>
        </div>
      </div>

      {/* Service & Oil Change Tracker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              {t.serviceSettingsTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.serviceSettingsSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Service Interval */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.serviceInterval}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                value={localSettings.serviceInterval ?? ''}
                onChange={(e) => updateField('serviceInterval', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-mono"
                placeholder={localSettings.vehicleType === 'threeWheeler' ? '3000' : '2500'}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                km
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              {t.serviceIntervalHint}
            </p>
          </div>

          {/* KM Driven Since Last Service */}
          <div>
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1 mb-1.5 h-5">
              <span className="truncate">{t.kmSinceLastService}</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="10"
                value={localSettings.kmSinceService ?? ''}
                onChange={(e) => updateField('kmSinceService', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500/50 outline-none transition-all font-mono"
                placeholder="0"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                km
              </span>
            </div>
            <p className="text-[9px] text-slate-500 mt-1 truncate">
              Auto-increments on rides
            </p>
          </div>
        </div>

        {/* Reset Service Counter Button */}
        <button
          type="button"
          onClick={() => {
            const updated = { ...localSettings, kmSinceService: 0 };
            setLocalSettings(updated);
            saveSettings(updated);
            setSettings(updated);
            showToast(t.serviceCounterReset);
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold py-2.5 px-3 rounded-xl transition-all text-xs active:scale-[0.98]"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.resetServiceCounter}</span>
        </button>
      </div>

      {/* Data Backup, Restore & Excel/CSV Export */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider leading-tight">
              {t.backupExportTitle}
            </h3>
            <p className="text-[10px] text-slate-400">{t.backupExportSub}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t.btnExportCsv}</span>
          </button>

          {/* Backup JSON Button */}
          <button
            type="button"
            onClick={handleBackupJson}
            className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>{t.btnBackupJson}</span>
          </button>

          {/* Restore JSON Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>{t.btnRestoreJson}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileRestore}
            className="hidden"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 text-sm"
        >
          <Save className="w-4 h-4" />
          {t.save}
        </button>
        <button
          type="button"
          onClick={handleReset}
          aria-label="Reset defaults"
          className="px-4 flex items-center justify-center bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
