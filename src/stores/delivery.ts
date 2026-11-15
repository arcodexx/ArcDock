import { defineStore } from 'pinia';
import { ref } from 'vue';

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
}

const STORAGE_KEY_DELIVERIES = 'arcdock_deliveries';

const loadParcels = (): ParcelItem[] => {
  const raw = localStorage.getItem(STORAGE_KEY_DELIVERIES);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    const seen = new Set<string>();
    return list.filter((p: any) => {
      if (!p || !p.id || !p.trackingNumber) return false;
      const key = p.trackingNumber.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      p.isLoading = false;
      return true;
    });
  } catch {
    return [];
  }
};

export const useDeliveryStore = defineStore('delivery', () => {
  const parcels = ref<ParcelItem[]>(loadParcels());
  const carriers = ref<CourierInfo[]>(DEFAULT_COURIER_LIST);
  const isRefreshing = ref<boolean>(false);
  const carriersLoaded = ref<boolean>(false);

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
      parcel.history = rawEvents.map((act: any) => {
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

    if (existingIdx !== -1) {
      targetParcel = parcels.value[existingIdx];
      targetParcel.title = title.trim() || targetParcel.title;
      targetParcel.courier = courier.toLowerCase();
      targetParcel.isLoading = true;
    } else {
      targetParcel = {
        id: `pkg-${Date.now()}`,
        title: title.trim() || 'New Package',
        trackingNumber: cleanNum,
        courier: courier.toLowerCase(),
        status: 'dispatched',
        estimatedDelivery: undefined,
        destination: undefined,
        lastCheckpoint: 'Connecting to courier network...',
        history: [], // Zero fake history
        isLoading: true,
      };
      parcels.value = [targetParcel, ...parcels.value];
    }

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
    saveParcels();
  };

  const clearAllParcels = () => {
    parcels.value = [];
    saveParcels();
  };

  // Initial load of carriers
  fetchCarriers();

  return {
    parcels,
    carriers,
    isRefreshing,
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
