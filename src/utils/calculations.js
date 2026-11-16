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
  commissionRate = 15,
}) {
  const { petrolPrice, kmPerLiter, maintenancePerKm } = settings;
  
  let netEarnings = earnings;
  let commissionAmount = 0;

  if (isGross && hireType === 'app') {
    commissionAmount = earnings * (commissionRate / 100);
    netEarnings = earnings - commissionAmount;
  } else if (hireType === 'road') {
    commissionAmount = 0;
    netEarnings = earnings;
  }

  const effectiveDistance = isRoundTrip ? tripDistance * 2 : tripDistance;
  const fuelCostPerKm = calcFuelCostPerKm(petrolPrice, kmPerLiter);
  const fuelCost = fuelCostPerKm * effectiveDistance;
  const maintenanceCost = (maintenancePerKm || 0) * effectiveDistance;
  const totalCost = fuelCost + maintenanceCost;
  const netProfit = netEarnings - totalCost;

  return {
    earnings: netEarnings,
    grossFare: isGross ? earnings : (hireType === 'app' ? netEarnings / (1 - commissionRate / 100) : netEarnings),
    commissionAmount,
    tripDistance,
    effectiveDistance,
    fuelCost,
    maintenanceCost,
    totalCost,
    netProfit,
    isRoundTrip,
    hireType,
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
      totalFuelCost: 0,
      totalMaintenanceCost: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalDistance: 0,
      totalEffectiveDistance: 0,
      hireCount: 0,
    };
  }

  return hires.reduce(
    (acc, hire) => ({
      totalEarnings: acc.totalEarnings + (hire.earnings || 0),
      totalFuelCost: acc.totalFuelCost + (hire.fuelCost || 0),
      totalMaintenanceCost: acc.totalMaintenanceCost + (hire.maintenanceCost || 0),
      totalCost: acc.totalCost + (hire.totalCost || 0),
      totalNetProfit: acc.totalNetProfit + (hire.netProfit || 0),
      totalDistance: acc.totalDistance + (hire.tripDistance || 0),
      totalEffectiveDistance: acc.totalEffectiveDistance + (hire.effectiveDistance || 0),
      hireCount: acc.hireCount + 1,
    }),
    {
      totalEarnings: 0,
      totalFuelCost: 0,
      totalMaintenanceCost: 0,
      totalCost: 0,
      totalNetProfit: 0,
      totalDistance: 0,
      totalEffectiveDistance: 0,
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
    // Also scan any localStorage keys that start with HIRES_KEY_PREFIX
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(HIRES_KEY_PREFIX)) {
        const d = key.replace(HIRES_KEY_PREFIX, '');
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
    daysTracked,
    currentMonthLabel: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
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
  },
  threeWheeler: {
    vehicleType: 'threeWheeler',
    kmPerLiter: 22,
    petrolPrice: 320,
    maintenancePerKm: 4.5,
    dailyTarget: 0,
  },
};

export const DEFAULT_SETTINGS = { ...PRESETS.motorbike };
