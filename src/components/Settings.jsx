import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Bike, Car, Wrench, Save, RotateCcw,
  Fuel, DollarSign, Target, CheckCircle2, Sparkles, Gauge, Percent
} from 'lucide-react';
import { calcFuelCostPerKm, calcTotalCostPerKm, PRESETS, DEFAULT_SETTINGS } from '../utils/calculations';

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
        defaultCommission: 16,
        defaultDeduction: 0,
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

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const fuelCostPerKm = calcFuelCostPerKm(localSettings.petrolPrice, localSettings.kmPerLiter);
  const totalCostPerKm = calcTotalCostPerKm(localSettings.petrolPrice, localSettings.kmPerLiter, localSettings.maintenancePerKm);

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
        dailyTarget: preset.dailyTarget,
        firstKmFare: preset.firstKmFare,
        secondKmRate: preset.secondKmRate,
        defaultCommission: localSettings.defaultCommission ?? 16,
        defaultDeduction: localSettings.defaultDeduction ?? 0,
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

        {/* Daily Leasing / Target Goal */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Target className="w-4 h-4 text-purple-400" />
            {t.dailyTarget}
          </label>
          <div className="relative">
            <input
              type="number"
              step="100"
              value={localSettings.dailyTarget || ''}
              onChange={(e) => setLocalSettings((prev) => ({ ...prev, dailyTarget: parseFloat(e.target.value) || 0 }))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-500 font-medium text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none transition-all font-mono"
              placeholder="e.g. 1600"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
              LKR
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{t.dailyTargetHint}</p>
        </div>
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

        <div className="grid grid-cols-2 gap-3">
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
