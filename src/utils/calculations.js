/**
 * Core calculation utilities for RideProfit LK
 */

export const HIRES_KEY_PREFIX = 'rideprofit_hires_';
export const BULK_KEY_PREFIX = 'rideprofit_bulk_';
export const DATES_INDEX_KEY = 'rideprofit_dates_index_v1';

/**
 * Calculate fuel cost per km
 * @param {number} petrolPrice - Price per liter in LKR
 * @param {number} kmPerLiter - Fuel efficiency in km/L
 * @returns {number} Fuel cost per km
 */
export function calcFuelCostPerKm(petrolPrice, kmPerLiter) {
  if (!kmPerLiter || kmPerLiter <= 0) return 0;
  return petrolPrice / kmPerLiter;
}

/**
 * Calculate total running cost per km (fuel + maintenance)
 * @param {number} petrolPrice - Price per liter in LKR
 * @param {number} kmPerLiter - Fuel efficiency in km/L
 * @param {number} maintenancePerKm - Maintenance/depreciation cost per km
 * @returns {number} Total cost per km
 */
export function calcTotalCostPerKm(petrolPrice, kmPerLiter, maintenancePerKm) {
  return calcFuelCostPerKm(petrolPrice, kmPerLiter) + (maintenancePerKm || 0);
}

/**
 * Calculate profit for a single hire
 * @param {object} params
 * @param {number} params.earnings - Net earnings received (or gross if isGross is true)
 * @param {number} params.tripDistance - Trip distance in km
 * @param {boolean} params.isRoundTrip - Whether driver returns empty
 * @param {object} params.settings - Vehicle settings
 * @param {string} [params.hireType] - 'app' | 'road'
 * @param {boolean} [params.isGross] - whether earnings was entered as gross fare
 * @param {number} [params.commissionRate] - app commission rate %
 * @returns {object} Breakdown of costs and profit
 */
export function calcHireProfit({
  earnings,
  tripDistance,
  isRoundTrip = false,
  settings,
  hireType = 'app',
  isGross = false,
  commissionRate,
  passengerDeduction,
  paymentMethod = 'cash',
}) {
  const { petrolPrice, kmPerLiter, maintenancePerKm } = settings;
  const effectiveCommission = commissionRate !== undefined ? commissionRate : (settings?.defaultCommission ?? 16);
  const effectiveDeduction = passengerDeduction !== undefined ? passengerDeduction : (settings?.defaultDeduction ?? 0);

  let netEarnings = earnings;
  let grossFare = earnings;
  let commissionAmount = 0;
  let deductionAmount = 0;

  if (hireType === 'app') {
    if (isGross) {
      grossFare = earnings;
      commissionAmount = grossFare * (effectiveCommission / 100);
      deductionAmount = effectiveDeduction;
      netEarnings = Math.max(0, grossFare - commissionAmount - deductionAmount);
    } else {
      netEarnings = earnings;
      deductionAmount = effectiveDeduction;
      const factor = 1 - effectiveCommission / 100;
      grossFare = factor > 0 ? (netEarnings + deductionAmount) / factor : netEarnings + deductionAmount;
      commissionAmount = Math.max(0, grossFare - netEarnings - deductionAmount);
    }
  } else {
    grossFare = earnings;
    netEarnings = earnings;
    commissionAmount = 0;
    deductionAmount = 0;
  }

  const appFees = hireType === 'app' ? Math.max(0, grossFare - netEarnings) : 0;
  const effectiveDistance = isRoundTrip ? tripDistance * 2 : tripDistance;
  const fuelCostPerKm = calcFuelCostPerKm(petrolPrice, kmPerLiter);
  const fuelCost = fuelCostPerKm * effectiveDistance;
  const maintenanceCost = (maintenancePerKm || 0) * effectiveDistance;
  const totalCost = fuelCost + maintenanceCost;
  const netProfit = netEarnings - totalCost;

  return {
    earnings: netEarnings,
    grossFare,
    commissionAmount,
    deductionAmount,
    appFees,
    tripDistance,
    effectiveDistance,
    fuelCost,
    maintenanceCost,
    totalCost,
    netProfit,
    isRoundTrip,
    hireType,
    paymentMethod,
  };
}

/**
 * Calculate end-of-day bulk profit
 * @param {number} appEarnings - Total app earnings (LKR)
 * @param {number} cashPickups - Total cash/road pickups (LKR)
 * @param {number} odometerDistance - Total distance driven (km)
 * @param {object} settings - Vehicle settings
 * @returns {object} Full day profit breakdown
 */
export function calcBulkProfit(appEarnings, cashPickups, odometerDistance, settings) {
  const { petrolPrice, kmPerLiter, maintenancePerKm } = settings;
  const grossEarnings = (appEarnings || 0) + (cashPickups || 0);
  const fuelCostPerKm = calcFuelCostPerKm(petrolPrice, kmPerLiter);
  const fuelCost = fuelCostPerKm * (odometerDistance || 0);
  const maintenanceCost = (maintenancePerKm || 0) * (odometerDistance || 0);
  const totalCost = fuelCost + maintenanceCost;
  const netProfit = grossEarnings - totalCost;

  return {
    appEarnings: appEarnings || 0,
    cashPickups: cashPickups || 0,
    grossEarnings,
    odometerDistance: odometerDistance || 0,
    fuelCost,
    maintenanceCost,
    totalCost,
    netProfit,
  };
}

/**
 * Evaluate whether a hire offer is worth accepting (Real-time evaluation)
 * @param {number} offeredFare - Fare offered by the app (LKR)
 * @param {number} pickupDistance - Distance to pick up passenger (km)
 * @param {number} tripDistance - Actual trip distance (km)
 * @param {number} commissionPercent - App commission (%)
 * @param {boolean} emptyReturn - Whether empty return is expected
 * @param {object} settings - Vehicle settings
 * @returns {object} Evaluation result with recommendation
 */
export function evaluateHire(offeredFare, pickupDistance, tripDistance, commissionPercent, emptyReturn, settings, otherDeductions = 0) {
  const { petrolPrice, kmPerLiter, maintenancePerKm } = settings;
  const pDist = Math.max(0, parseFloat(pickupDistance) || 0);
  const tDist = Math.max(0, parseFloat(tripDistance) || 0);
  const oFare = Math.max(0, parseFloat(offeredFare) || 0);
  const comm = Math.max(0, parseFloat(commissionPercent) || 0);
  const extraDed = Math.max(0, parseFloat(otherDeductions) || 0);

  const commissionAmount = oFare * (comm / 100);
  const totalDeductionsAmount = commissionAmount + extraDed;
  const earningsAfterCommission = oFare - totalDeductionsAmount;
  
  // Total distance: pickup + trip + (optional return trip)
  let totalDistance = pDist + tDist;
  if (emptyReturn) {
    totalDistance += tDist;
  }

  const fuelCostPerKm = calcFuelCostPerKm(petrolPrice, kmPerLiter);
  const totalCostPerKm = calcTotalCostPerKm(petrolPrice, kmPerLiter, maintenancePerKm);
  const fuelCost = fuelCostPerKm * totalDistance;
  const maintenanceCost = (maintenancePerKm || 0) * totalDistance;
  const totalCost = fuelCost + maintenanceCost;
  const netProfit = earningsAfterCommission - totalCost;
  const profitPerKm = totalDistance > 0 ? netProfit / totalDistance : 0;

  // Minimum fare needed to break even + small margin
  const minimumFare = comm < 100 ? (totalCost + extraDed) / (1 - comm / 100) : (totalCost + extraDed);

  // Consider profitable if net profit is at least positive (ideally > LKR 50 or > LKR 25/km)
  const isProfitable = netProfit > 0 && (totalDistance === 0 || profitPerKm >= 5);

  return {
    offeredFare: oFare,
    commissionAmount,
    otherDeductions: extraDed,
    totalDeductionsAmount,
    earningsAfterCommission,
    pickupDistance: pDist,
    tripDistance: tDist,
    totalDistance,
    fuelCost,
    maintenanceCost,
    totalCost,
    netProfit,
    profitPerKm,
    minimumFare,
    isProfitable,
  };
}

/**
 * Aggregate daily hires into a summary
 * @param {Array} hires - Array of hire objects
 * @returns {object} Aggregated summary
 */
export function aggregateHires(hires) {
  if (!hires || hires.length === 0) {
    return {
      totalEarnings: 0,
      totalGrossEarnings: 0,
      totalAppGrossEarnings: 0,
      totalNetAppPayout: 0,
      totalAppFees: 0,
      totalFuelCost: 0,
      totalMaintenanceCost: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalDistance: 0,
      totalEffectiveDistance: 0,
      totalCashEarnings: 0,
      totalCardEarnings: 0,
      hireCount: 0,
    };
  }

  return hires.reduce(
    (acc, hire) => {
      const isCard = hire.paymentMethod === 'card';
      const isApp = hire.hireType !== 'road';
      const netVal = hire.earnings || 0;
      const grossVal = isApp ? (hire.grossFare || netVal) : netVal;
      const appFeeVal = isApp
        ? (hire.appFees !== undefined ? hire.appFees : Math.max(0, grossVal - netVal))
        : 0;

      return {
        totalEarnings: acc.totalEarnings + netVal,
        totalGrossEarnings: acc.totalGrossEarnings + grossVal,
        totalAppGrossEarnings: acc.totalAppGrossEarnings + (isApp ? grossVal : 0),
        totalNetAppPayout: acc.totalNetAppPayout + (isApp ? netVal : 0),
        totalAppFees: acc.totalAppFees + appFeeVal,
        totalFuelCost: acc.totalFuelCost + (hire.fuelCost || 0),
        totalMaintenanceCost: acc.totalMaintenanceCost + (hire.maintenanceCost || 0),
        totalCost: acc.totalCost + (hire.totalCost || 0),
        totalNetProfit: acc.totalNetProfit + (hire.netProfit || 0),
        totalDistance: acc.totalDistance + (hire.tripDistance || 0),
        totalEffectiveDistance: acc.totalEffectiveDistance + (hire.effectiveDistance || 0),
        totalCashEarnings: acc.totalCashEarnings + (isCard ? 0 : netVal),
        totalCardEarnings: acc.totalCardEarnings + (isCard ? netVal : 0),
        hireCount: acc.hireCount + 1,
      };
    },
    {
      totalEarnings: 0,
      totalGrossEarnings: 0,
      totalAppGrossEarnings: 0,
      totalNetAppPayout: 0,
      totalAppFees: 0,
      totalFuelCost: 0,
      totalMaintenanceCost: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalDistance: 0,
      totalEffectiveDistance: 0,
      totalCashEarnings: 0,
      totalCardEarnings: 0,
      hireCount: 0,
    }
  );
}

/**
 * Format a number as LKR currency
 * @param {number} amount
 * @returns {string}
 */
export function formatLKR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'LKR 0.00';
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return isNegative ? `-LKR ${absFormatted}` : `LKR ${absFormatted}`;
}

/**
 * Get today's date key in YYYY-MM-DD format
 * @returns {string}
 */
export function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Register a date in the date index to track history
 * @param {string} dateKey - 'YYYY-MM-DD'
 */
export function registerDateInIndex(dateKey) {
  try {
    const raw = localStorage.getItem(DATES_INDEX_KEY);
    const set = new Set(raw ? JSON.parse(raw) : []);
    set.add(dateKey);
    localStorage.setItem(DATES_INDEX_KEY, JSON.stringify(Array.from(set).sort().reverse()));
  } catch (e) {
    console.error('Failed to update date index:', e);
  }
}

/**
 * Load all tracked dates
 * @returns {string[]}
 */
export function getTrackedDates() {
  try {
    const raw = localStorage.getItem(DATES_INDEX_KEY);
    const dates = raw ? JSON.parse(raw) : [];
    const today = getTodayKey();
    if (!dates.includes(today)) {
      dates.unshift(today);
    }
    // Also scan any localStorage keys that start with HIRES_KEY_PREFIX or BULK_KEY_PREFIX
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(HIRES_KEY_PREFIX) || key.startsWith(BULK_KEY_PREFIX))) {
        const d = key.replace(HIRES_KEY_PREFIX, '').replace(BULK_KEY_PREFIX, '');
        if (d && !dates.includes(d)) {
          dates.push(d);
        }
      }
    }
    return Array.from(new Set(dates)).sort().reverse();
  } catch (e) {
    return [getTodayKey()];
  }
}

/**
 * Delete a specific date's entire records (hires, bulk, and index entry)
 * @param {string} dateKey - 'YYYY-MM-DD'
 */
export function deleteDateFromHistory(dateKey) {
  try {
    localStorage.removeItem(HIRES_KEY_PREFIX + dateKey);
    localStorage.removeItem(BULK_KEY_PREFIX + dateKey);
    const raw = localStorage.getItem(DATES_INDEX_KEY);
    if (raw) {
      const dates = JSON.parse(raw);
      const filtered = dates.filter((d) => d !== dateKey);
      localStorage.setItem(DATES_INDEX_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Failed to delete date from history:', e);
  }
}

/**
 * Get month-to-date summary from all stored daily logs
 * @returns {object} Monthly summary metrics
 */
export function getMonthlySummary() {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  let monthlyEarnings = 0;
  let monthlyNetProfit = 0;
  let monthlyDistance = 0;
  let monthlyTrips = 0;
  let monthlyMaintenanceCost = 0;
  let daysTracked = 0;

  const dates = getTrackedDates();
  dates.forEach((dateStr) => {
    if (dateStr.startsWith(currentMonthPrefix)) {
      try {
        const hiresRaw = localStorage.getItem(HIRES_KEY_PREFIX + dateStr);
        if (hiresRaw) {
          const hires = JSON.parse(hiresRaw);
          if (Array.isArray(hires) && hires.length > 0) {
            const sum = aggregateHires(hires);
            monthlyEarnings += sum.totalEarnings;
            monthlyNetProfit += sum.totalNetProfit;
            monthlyDistance += sum.totalEffectiveDistance;
            monthlyTrips += sum.hireCount;
            monthlyMaintenanceCost += sum.totalMaintenanceCost;
            daysTracked += 1;
            return;
          }
        }
        // Check if there was a bulk calculation for this date
        const bulkRaw = localStorage.getItem(BULK_KEY_PREFIX + dateStr);
        if (bulkRaw) {
          const bulk = JSON.parse(bulkRaw);
          monthlyEarnings += bulk.grossEarnings || 0;
          monthlyNetProfit += bulk.netProfit || 0;
          monthlyDistance += bulk.odometerDistance || 0;
          monthlyMaintenanceCost += bulk.maintenanceCost || 0;
          daysTracked += 1;
        }
      } catch (e) {
        // ignore parsing error
      }
    }
  });

  return {
    monthlyEarnings,
    monthlyNetProfit,
    monthlyDistance,
    monthlyTrips,
    monthlyMaintenanceCost,
    daysTracked,
    currentMonthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

/**
 * Calculate standard Sri Lankan meter taxi fare
 * @param {number} distance - Trip distance in km
 * @param {number} firstKmFare - 1st KM base fare (LKR)
 * @param {number} secondKmRate - 2nd KM onwards rate (LKR/km)
 * @returns {number} Meter fare in LKR
 */
export function calcMeterFare(distance, firstKmFare = 100, secondKmRate = 85) {
  const d = Math.max(0, parseFloat(distance) || 0);
  if (d <= 0) return 0;
  const f1 = parseFloat(firstKmFare) || 0;
  const f2 = parseFloat(secondKmRate) || 0;
  if (d <= 1) return f1;
  return f1 + ((d - 1) * f2);
}

/**
 * Calculate full trip cost details: effective distance, fuel needed, total costs, meter fare, and net profit
 * @param {object} params
 * @param {number} params.distance - One-way trip distance (km)
 * @param {boolean} params.isReturnTrip - Whether vehicle travels return journey (2x distance)
 * @param {object} params.settings - Vehicle & meter settings
 * @param {number} [params.waitingMinutes] - Total waiting time in minutes
 * @returns {object} Breakdown of trip costs and meter earnings
 */
export function calcTripCostDetails({ distance, isReturnTrip, settings, waitingMinutes = 0 }) {
  const d = Math.max(0, parseFloat(distance) || 0);
  const {
    petrolPrice = 320,
    kmPerLiter = 22,
    maintenancePerKm = 4.5,
    firstKmFare = 100,
    secondKmRate = 85,
    waitingRatePerMin,
    vehicleType,
  } = settings;

  const defaultWaitRate = vehicleType === 'threeWheeler' ? 5 : 4;
  const waitRate = waitingRatePerMin !== undefined && waitingRatePerMin !== null && !isNaN(waitingRatePerMin)
    ? parseFloat(waitingRatePerMin)
    : defaultWaitRate;
  const waitMins = Math.max(0, parseFloat(waitingMinutes) || 0);
  const totalWaitingCharge = waitMins * waitRate;

  const effectiveDistance = isReturnTrip ? d * 2 : d;
  const fuelCostPerKm = calcFuelCostPerKm(petrolPrice, kmPerLiter);
  const fuelLiters = kmPerLiter > 0 ? effectiveDistance / kmPerLiter : 0;
  const totalFuelCost = fuelCostPerKm * effectiveDistance;
  const totalMaintenanceCost = (maintenancePerKm || 0) * effectiveDistance;
  const totalRunningCost = totalFuelCost + totalMaintenanceCost;

  // Single-way standard meter fare (distance fare + waiting charge)
  const baseOneWayMeterFare = calcMeterFare(d, firstKmFare, secondKmRate);
  const oneWayMeterFare = baseOneWayMeterFare + totalWaitingCharge;
  const roundTripMeterFare = (baseOneWayMeterFare * 2) + totalWaitingCharge;

  // One-way scenario (1x distance & 1x running cost, 100% waiting adds to profit)
  const oneWayNetProfit = oneWayMeterFare - totalRunningCost;
  const oneWayProfitMargin = oneWayMeterFare > 0 ? (oneWayNetProfit / oneWayMeterFare) * 100 : 0;

  // Round-trip Scenario 1: Customer pays 1x fare, driver returns empty (2x running cost)
  const emptyReturnNetProfit = oneWayMeterFare - totalRunningCost;
  const emptyReturnMargin = oneWayMeterFare > 0 ? (emptyReturnNetProfit / oneWayMeterFare) * 100 : 0;

  // Round-trip Scenario 2: Customer pays 2x fare (2x running cost)
  const roundTripNetProfit = roundTripMeterFare - totalRunningCost;
  const roundTripMargin = roundTripMeterFare > 0 ? (roundTripNetProfit / roundTripMeterFare) * 100 : 0;

  return {
    oneWayDistance: d,
    isReturnTrip,
    effectiveDistance,
    fuelLiters,
    totalFuelCost,
    totalMaintenanceCost,
    totalRunningCost,
    baseOneWayMeterFare,
    waitingMinutes: waitMins,
    waitingRatePerMin: waitRate,
    totalWaitingCharge,
    oneWayMeterFare,
    roundTripMeterFare,
    oneWayNetProfit,
    oneWayProfitMargin,
    emptyReturnNetProfit,
    emptyReturnMargin,
    roundTripNetProfit,
    roundTripMargin,
    costPerKm: effectiveDistance > 0 ? totalRunningCost / effectiveDistance : 0,
  };
}

/**
 * Default settings presets
 */
export const PRESETS = {
  motorbike: {
    vehicleType: 'motorbike',
    kmPerLiter: 47,
    petrolPrice: 320,
    maintenancePerKm: 4.0,
    dailyTarget: 0,
    firstKmFare: 75,
    secondKmRate: 55,
    waitingRatePerMin: 4,
    defaultCommission: 16,
    defaultDeduction: 0,
    serviceInterval: 2500,
    kmSinceService: 0,
  },
  threeWheeler: {
    vehicleType: 'threeWheeler',
    kmPerLiter: 22,
    petrolPrice: 320,
    maintenancePerKm: 4.5,
    dailyTarget: 0,
    firstKmFare: 100,
    secondKmRate: 85,
    waitingRatePerMin: 5,
    defaultCommission: 16,
    defaultDeduction: 0,
    serviceInterval: 3000,
    kmSinceService: 0,
  },
};

export const DEFAULT_SETTINGS = {
  ...PRESETS.motorbike,
  waitingRatePerMin: 4,
  defaultCommission: 16,
  defaultDeduction: 0,
  serviceInterval: 2500,
  kmSinceService: 0,
};

/**
 * Export all logged trips across all dates to CSV format
 * @returns {string} CSV content
 */
export function exportAllDataToCSV() {
  const headers = [
    'Date',
    'Time',
    'Category',
    'Payment Method',
    'Trip Distance (km)',
    'Effective Distance (km)',
    'Earnings (LKR)',
    'Fuel Cost (LKR)',
    'Maintenance Cost (LKR)',
    'Total Cost (LKR)',
    'Net Profit (LKR)',
  ];

  const rows = [];
  const dates = getTrackedDates();

  dates.forEach((dateStr) => {
    try {
      const hiresRaw = localStorage.getItem(HIRES_KEY_PREFIX + dateStr);
      if (hiresRaw) {
        const hires = JSON.parse(hiresRaw);
        if (Array.isArray(hires)) {
          hires.forEach((hire) => {
            rows.push([
              dateStr,
              hire.time || '',
              hire.hireType === 'road' ? 'Road Pickup' : 'App Hire',
              hire.paymentMethod === 'card' ? 'Card / Wallet' : 'Cash',
              (hire.tripDistance || 0).toFixed(1),
              (hire.effectiveDistance || hire.tripDistance || 0).toFixed(1),
              (hire.earnings || 0).toFixed(2),
              (hire.fuelCost || 0).toFixed(2),
              (hire.maintenanceCost || 0).toFixed(2),
              (hire.totalCost || 0).toFixed(2),
              (hire.netProfit || 0).toFixed(2),
            ]);
          });
        }
      }

      // Also check if bulk was recorded for this day
      const bulkRaw = localStorage.getItem(BULK_KEY_PREFIX + dateStr);
      if (bulkRaw) {
        const bulk = JSON.parse(bulkRaw);
        rows.push([
          dateStr,
          'EOD Bulk',
          'End-of-Day Bulk',
          'Mixed',
          (bulk.odometerDistance || 0).toFixed(1),
          (bulk.odometerDistance || 0).toFixed(1),
          (bulk.grossEarnings || 0).toFixed(2),
          (bulk.fuelCost || 0).toFixed(2),
          (bulk.maintenanceCost || 0).toFixed(2),
          (bulk.totalCost || 0).toFixed(2),
          (bulk.netProfit || 0).toFixed(2),
        ]);
      }
    } catch (e) {
      console.error('Error exporting date to CSV:', dateStr, e);
    }
  });

  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export complete backup of all RideProfit LK localStorage keys as JSON
 * @returns {object} Full backup object
 */
export function exportFullBackupJSON() {
  const backup = {
    app: 'RideProfit LK',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {},
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('rideprofit_') || key.startsWith('rideprofit_hires_') || key.startsWith('rideprofit_bulk_') || key.startsWith('rideprofit_shift_'))) {
        backup.data[key] = localStorage.getItem(key);
      }
    }
  } catch (e) {
    console.error('Failed to export backup:', e);
  }

  return backup;
}

/**
 * Restore complete backup into localStorage
 * @param {string|object} backupData - Parsed JSON object or JSON string
 * @returns {boolean} Success status
 */
export function restoreFullBackupJSON(backupData) {
  try {
    const parsed = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
    if (!parsed || !parsed.data || typeof parsed.data !== 'object') {
      throw new Error('Invalid backup data format');
    }

    Object.entries(parsed.data).forEach(([key, val]) => {
      if (key.startsWith('rideprofit_')) {
        localStorage.setItem(key, val);
      }
    });

    return true;
  } catch (e) {
    console.error('Failed to restore backup:', e);
    return false;
  }
}
