import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CourierInfo {
  id: string;
  name: string;
  color?: string;
}

export const DEFAULT_COURIER_LIST: CourierInfo[] = [
  { id: 'delhivery', name: 'Delhivery', color: 'text-red-400' },
  { id: 'bluedart', name: 'Blue Dart', color: 'text-blue-400' },
  { id: 'ekart', name: 'Ekart Logistics', color: 'text-yellow-400' },
  { id: 'amazon', name: 'Amazon Shipping', color: 'text-amber-400' },
  { id: 'stcourier', name: 'ST Courier', color: 'text-purple-400' },
  { id: 'tpc', name: 'The Professional Couriers', color: 'text-indigo-400' },
  { id: 'shiprocket', name: 'Shiprocket', color: 'text-violet-400' },
  { id: 'dtdc', name: 'DTDC', color: 'text-sky-400' },
  { id: 'xpressbees', name: 'Xpressbees', color: 'text-orange-400' },
  { id: 'india-post', name: 'India Post', color: 'text-emerald-400' },
  { id: 'shadowfax', name: 'Shadowfax', color: 'text-cyan-400' },
];

export const COURIER_LIST = DEFAULT_COURIER_LIST;

export function getCourierTrackingUrl(courier: string, awb: string): string {
  const cleanAwb = encodeURIComponent(awb.trim());
  switch (courier.toLowerCase()) {
    case 'delhivery':
      return `https://www.delhivery.com/track/package/${cleanAwb}`;
    case 'bluedart':
      return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${cleanAwb}`;
    case 'dtdc':
      return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb_no&strCNNo=${cleanAwb}`;
    case 'ekart':
      return `https://ekartlogistics.com/shipmenttrack/${cleanAwb}`;
    case 'amazon':
      return `https://track.amazon.in/tracking/${cleanAwb}`;
    case 'xpressbees':
      return `https://www.xpressbees.com/track?tracking_id=${cleanAwb}`;
    case 'stcourier':
      return `https://stcourier.com/track/tracking_details/${cleanAwb}`;
    case 'tpc':
      return `https://www.tpcindia.com`;
    case 'shadowfax':
      return `https://tracker.shadowfax.in/#/track?trackingNumber=${cleanAwb}`;
    case 'india-post':
      return `https://www.indiapost.gov.in`;
    default:
      return `https://t.17track.net/en#nums=${cleanAwb}`;
  }
}

export type DeliveryStatus = 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered';

export interface TrackingCheckpoint {
  time: string;
  location: string;
  status: string;
}

export interface ParcelItem {
  id: string;
  title: string;
  trackingNumber: string;
  courier: string;
  status: DeliveryStatus;
  estimatedDelivery?: string;
  destination?: string;
  lastCheckpoint: string;
  history: TrackingCheckpoint[];
  isLoading?: boolean;
  createdAt?: number;
}

const STORAGE_KEY_DELIVERIES = 'arcdock_deliveries';

// Helper to extract timestamp from parcel for ordering
export const getParcelTimestamp = (p: any): number => {
  if (p && typeof p.createdAt === 'number' && p.createdAt > 0) return p.createdAt;
  if (p && typeof p.id === 'string') {
    const match = p.id.match(/\d{10,}/);
    if (match) {
      const ts = parseInt(match[0], 10);
      if (!isNaN(ts)) return ts;
    }
  }
  return 0;
};

// Sorts parcels newest first: highest timestamp on top
export const sortParcelsNewestFirst = (list: ParcelItem[]): ParcelItem[] => {
  const hasTimestamps = list.some((p) => getParcelTimestamp(p) > 0);
  if (hasTimestamps) {
    return [...list].sort((a, b) => getParcelTimestamp(b) - getParcelTimestamp(a));
  }
  // Fallback: if items were in chronological order (oldest first), reverse them so newest is on top
  return [...list].reverse();
};

// Helper to extract timestamp from an individual tracking event
export const getEventTimestamp = (act: any): number => {
  if (!act) return 0;
  const raw = act.timestamp || act.date || act.time || act.statusDateTime || act.datetime || act.created_at;
  if (!raw) return 0;
  if (typeof raw === 'number') {
    return raw > 1e11 ? raw : raw * 1000;
  }
  if (typeof raw === 'string') {
    // Check for DD-MM-YYYY or DD/MM/YYYY formats common with Indian couriers
    const dmyMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)$/);
    if (dmyMatch) {
      const iso = `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}${dmyMatch[4]}`;
      const parsed = Date.parse(iso);
      if (!isNaN(parsed)) return parsed;
    }
    const d = Date.parse(raw);
    if (!isNaN(d)) return d;
  }
  return 0;
};

const EARLY_KEYWORDS = ['order received', 'manifest', 'booked', 'pickup scheduled', 'registered', 'created', 'label created', 'data received', 'shipment info received', 'pickup created'];
const LATE_KEYWORDS = ['delivered', 'out for delivery', 'in transit', 'transit', 'reached', 'arrived', 'bag', 'hub', 'dispatched', 'departed', 'trip'];

// Sorts checkpoint events newest first (most recent event at index 0)
export const sortEventsNewestFirst = (events: any[]): any[] => {
  if (!events || events.length <= 1) return events || [];

  // 1. Try comparing timestamps between first and last events
  const firstT = getEventTimestamp(events[0]);
  const lastT = getEventTimestamp(events[events.length - 1]);

  if (firstT > 0 && lastT > 0 && firstT !== lastT) {
    if (firstT < lastT) {
      // First is older than last -> chronological order -> reverse so newest is at index 0
      return [...events].reverse();
    }
    // Already newest first
    return events;
  }

  // 2. Fallback to status keyword classification (e.g. "Order received" vs "In transit bag added to trip")
  const firstStatus = String(events[0]?.status || events[0]?.description || events[0] || '').toLowerCase();
  const lastStatus = String(events[events.length - 1]?.status || events[events.length - 1]?.description || events[events.length - 1] || '').toLowerCase();

  const firstIsEarly = EARLY_KEYWORDS.some((kw) => firstStatus.includes(kw));
  const lastIsLate = LATE_KEYWORDS.some((kw) => lastStatus.includes(kw));

  if (firstIsEarly || lastIsLate) {
    return [...events].reverse();
  }

  const firstIsLate = LATE_KEYWORDS.some((kw) => firstStatus.includes(kw));
  const lastIsEarly = EARLY_KEYWORDS.some((kw) => lastStatus.includes(kw));
  if (firstIsLate || lastIsEarly) {
    return events;
  }

  // Couriers typically output tracking events oldest -> newest, so reverse as safest default
  return [...events].reverse();
};

const loadParcels = (): ParcelItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_DELIVERIES);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    const filtered = list.filter((p: any) => {
      if (!p || !p.id || !p.trackingNumber) return false;
      const key = p.trackingNumber.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      p.isLoading = false;
      return true;
    });

    // Ensure all loaded parcels also have their checkpoint history sorted newest first
    const normalized = filtered.map((p: ParcelItem) => {
      if (Array.isArray(p.history) && p.history.length > 1) {
        p.history = sortEventsNewestFirst(p.history);
        p.lastCheckpoint = p.history[0]?.status || p.lastCheckpoint;
      }
      return p;
    });

    return sortParcelsNewestFirst(normalized);
  } catch {
    return [];
  }
};

export const useDeliveryStore = defineStore('delivery', () => {
  const parcels = ref<ParcelItem[]>(loadParcels());
  const selectedParcelId = ref<string | null>(parcels.value[0]?.id || null);
  const carriers = ref<CourierInfo[]>(DEFAULT_COURIER_LIST);
  const isRefreshing = ref<boolean>(false);
  const carriersLoaded = ref<boolean>(false);

  // Active parcel for main screen & control center: defaults to newest parcel (parcels[0])
  const activeParcel = computed<ParcelItem | null>(() => {
    if (selectedParcelId.value) {
      const found = parcels.value.find((p) => p.id === selectedParcelId.value);
      if (found) return found;
    }
    return parcels.value[0] || null;
  });

  const selectParcel = (id: string) => {
    selectedParcelId.value = id;
  };

  const saveParcels = () => {
    localStorage.setItem(STORAGE_KEY_DELIVERIES, JSON.stringify(parcels.value));
  };

  // Helper to parse date string into readable format
  const formatEventDate = (raw: any): string => {
    if (!raw) return 'Recent';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
    } catch {}
    return String(raw);
  };

  // Apply parsed ShipTrack data to a parcel object
  const applyShipTrackData = (parcel: ParcelItem, data: any) => {
    if (!data) return;

    // 1. Status normalization
    const rawStatus = String(data.status || '').toLowerCase().trim();
    if (rawStatus === 'delivered' || (rawStatus.includes('deliver') && !rawStatus.includes('out'))) {
      parcel.status = 'delivered';
    } else if (rawStatus === 'out_for_delivery' || rawStatus.includes('out')) {
      parcel.status = 'out_for_delivery';
    } else if (rawStatus === 'in_transit' || rawStatus.includes('transit')) {
      parcel.status = 'in_transit';
    } else {
      parcel.status = 'dispatched';
    }

    // 2. Estimated delivery & Destination
    if (data.estimatedDelivery) {
      parcel.estimatedDelivery = data.estimatedDelivery;
    }
    if (data.destination) {
      parcel.destination = data.destination;
    }

    // 3. Events array from ShipTrack (data.events or data.activities)
    const rawEvents = data.events || data.activities || [];
    if (Array.isArray(rawEvents) && rawEvents.length > 0) {
      const sortedEvents = sortEventsNewestFirst(rawEvents);
      parcel.history = sortedEvents.map((act: any) => {
        if (typeof act === 'string') {
          return {
            time: 'Recent',
            location: parcel.destination ? `Dest: ${parcel.destination}` : 'In Transit',
            status: act,
          };
        }

        const timeStr = formatEventDate(act.date || act.time || act.timestamp || act.statusDateTime);
        const locStr = act.location || act.city || act.scannedLocation || data.destination || '';
        const descStr = act.description || act.status || act.activity || act.instructions || act.message || 'Checkpoint updated';

        return {
          time: timeStr,
          location: locStr || (parcel.destination ? `Dest: ${parcel.destination}` : 'In Transit'),
          status: descStr,
        };
      });

      // Index 0 is now guaranteed to be the most recent checkpoint!
      parcel.lastCheckpoint = parcel.history[0]?.status || parcel.lastCheckpoint;
    } else if (data.status) {
      parcel.lastCheckpoint = `Status: ${data.status}`;
    }
  };

  // Track single shipment via local server bridge (zero CORS)
  const trackShipment = async (carrier: string, trackingNumber: string) => {
    const cleanNum = encodeURIComponent(trackingNumber.trim());
    const cleanCarrier = encodeURIComponent(carrier.toLowerCase().trim());

    try {
      const res = await fetch(`/api/track/${cleanCarrier}/${cleanNum}`);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.status || data.events || data.carrier)) {
          return data;
        }
      }
    } catch (e) {
      console.warn(`[ShipTrack] Bridge error for ${carrier}/${trackingNumber}:`, e);
    }
    return null;
  };

  // Fetch supported carriers from local bridge
  const fetchCarriers = async () => {
    if (carriersLoaded.value) return;
    try {
      const res = await fetch('/api/carriers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const list: CourierInfo[] = [];
          for (const item of data) {
            const id = typeof item === 'string' ? item : item.id || item.code || item.name;
            const name = typeof item === 'string' 
              ? (DEFAULT_COURIER_LIST.find((c) => c.id === id)?.name || id.toUpperCase())
              : item.name || id;
            const existing = DEFAULT_COURIER_LIST.find((c) => c.id.toLowerCase() === id.toLowerCase());
            list.push({
              id: id.toLowerCase(),
              name,
              color: existing?.color || 'text-amber-400',
            });
          }
          for (const def of DEFAULT_COURIER_LIST) {
            if (!list.some((c) => c.id === def.id)) {
              list.push(def);
            }
          }
          carriers.value = list;
          carriersLoaded.value = true;
        }
      }
    } catch {}
  };

  // Refresh all active shipments with reactivity trigger
  const refreshParcels = async () => {
    if (parcels.value.length === 0) return;
    isRefreshing.value = true;

    try {
      const updatedList: ParcelItem[] = [];
      for (const p of parcels.value) {
        const itemCopy = { ...p };
        const data = await trackShipment(itemCopy.courier, itemCopy.trackingNumber);
        if (data) {
          applyShipTrackData(itemCopy, data);
        }
        updatedList.push(itemCopy);
      }
      parcels.value = updatedList;
      saveParcels();
    } finally {
      isRefreshing.value = false;
    }
  };

  // Refresh a single parcel individually
  const refreshSingleParcel = async (id: string) => {
    const p = parcels.value.find((item) => item.id === id);
    if (!p) return;

    p.isLoading = true;
    parcels.value = parcels.value.map((item) => (item.id === id ? { ...p } : item));

    try {
      const data = await trackShipment(p.courier, p.trackingNumber);
      if (!parcels.value.some((item) => item.id === id)) return;

      if (data) {
        applyShipTrackData(p, data);
      }
    } catch (e) {
      console.warn(`[ShipTrack] Single refresh error for ${p.trackingNumber}:`, e);
    } finally {
      if (parcels.value.some((item) => item.id === id)) {
        p.isLoading = false;
        parcels.value = parcels.value.map((item) => (item.id === id ? { ...p } : item));
        saveParcels();
      }
    }
  };

  const addParcel = async (title: string, trackingNumber: string, courier: string) => {
    const cleanNum = trackingNumber.trim();
    if (!cleanNum) return;

    // Check for existing package with same tracking number to prevent duplicates
    const existingIdx = parcels.value.findIndex((p) => p.trackingNumber.toLowerCase() === cleanNum.toLowerCase());

    let targetParcel: ParcelItem;
    const now = Date.now();

    if (existingIdx !== -1) {
      targetParcel = parcels.value[existingIdx];
      targetParcel.title = title.trim() || targetParcel.title;
      targetParcel.courier = courier.toLowerCase();
      targetParcel.isLoading = true;
      targetParcel.createdAt = now;
      // Move updated parcel to the front (newest)
      parcels.value = [targetParcel, ...parcels.value.filter((_, idx) => idx !== existingIdx)];
    } else {
      targetParcel = {
        id: `pkg-${now}`,
        title: title.trim() || 'New Package',
        trackingNumber: cleanNum,
        courier: courier.toLowerCase(),
        status: 'dispatched',
        estimatedDelivery: undefined,
        destination: undefined,
        lastCheckpoint: 'Connecting to courier network...',
        history: [], // Zero fake history
        isLoading: true,
        createdAt: now,
      };
      // Prepend to the top so newest is always first
      parcels.value = [targetParcel, ...parcels.value];
    }

    selectedParcelId.value = targetParcel.id;
    saveParcels();

    // Query live tracking immediately
    try {
      const data = await trackShipment(targetParcel.courier, targetParcel.trackingNumber);
      if (!parcels.value.some((p) => p.id === targetParcel.id)) {
        return;
      }

      if (data) {
        applyShipTrackData(targetParcel, data);
      } else {
        targetParcel.lastCheckpoint = 'No scans found yet. Tap Sync Live to retry.';
      }

      targetParcel.isLoading = false;
      parcels.value = parcels.value.map((p) => (p.id === targetParcel.id ? { ...targetParcel } : p));
      saveParcels();
    } catch (e) {
      console.warn('[ShipTrack] Immediate tracking sync failed:', e);
      if (parcels.value.some((p) => p.id === targetParcel.id)) {
        targetParcel.isLoading = false;
        targetParcel.lastCheckpoint = 'Courier tracking request failed.';
        parcels.value = parcels.value.map((p) => (p.id === targetParcel.id ? { ...targetParcel } : p));
        saveParcels();
      }
    }
  };

  const removeParcel = (id: string) => {
    parcels.value = parcels.value.filter((p) => p.id !== id);
    if (selectedParcelId.value === id) {
      selectedParcelId.value = parcels.value[0]?.id || null;
    }
    saveParcels();
  };

  const clearAllParcels = () => {
    parcels.value = [];
    selectedParcelId.value = null;
    saveParcels();
  };

  // Initial load of carriers
  fetchCarriers();

  return {
    parcels,
    carriers,
    isRefreshing,
    selectedParcelId,
    activeParcel,
    selectParcel,
    fetchCarriers,
    trackShipment,
    refreshParcels,
    refreshSingleParcel,
    addParcel,
    removeParcel,
    clearAllParcels,
    getCourierTrackingUrl,
  };
});
