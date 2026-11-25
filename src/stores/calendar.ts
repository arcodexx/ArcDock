import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useTimezonesStore } from '@/stores/timezones';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  startTimeFormatted: string; // E.g. "6:30 PM" in IST
  endTimeFormatted: string;   // E.g. "7:00 PM" in IST
  location?: string;
  description?: string;
  meetUrl?: string;
  isOngoing: boolean;
  isPassed: boolean;
  minutesUntil: number;
  formattedTimeRange: string;
  isToday: boolean;
  isTomorrow: boolean;
  dayLabel: string;
  startDateFormatted: string;
}

export const useCalendarStore = defineStore('calendar', () => {
  const FEED_URL_KEY = 'arcdock_calendar_feed_url';
  const USE_SAMPLE_KEY = 'arcdock_calendar_sample';

  const timezones = useTimezonesStore();

  const storedUrl = localStorage.getItem(FEED_URL_KEY) || '';
  const storedSample = localStorage.getItem(USE_SAMPLE_KEY);

  const feedUrl = ref<string>(storedUrl);
  // Default to sample mode only if user has not configured a feed URL
  const useSampleEvents = ref<boolean>(storedSample !== null ? storedSample === 'true' : !storedUrl);
  const events = ref<CalendarEvent[]>([]);
  const isLoading = ref<boolean>(false);
  const lastSync = ref<Date | null>(null);

  let minuteTicker: number | null = null;
  let eventTimers: number[] = [];

  // Re-evaluates isOngoing, isPassed, and minutesUntil dynamically against current client clock
  // and schedules exact start/end timers so the UI updates without requiring network fetches
  const refreshEventStatuses = () => {
    if (events.value.length === 0) return;
    const nowMs = Date.now();

    // Clear previous pending transition timers
    eventTimers.forEach((t) => window.clearTimeout(t));
    eventTimers = [];

    events.value = events.value.map((ev) => {
      const startMs = new Date(ev.startTime).getTime();
      const endMs = new Date(ev.endTime).getTime();

      const isOngoing = nowMs >= startMs && nowMs <= endMs;
      const isPassed = nowMs > endMs;
      const minutesUntil = Math.round((startMs - nowMs) / 60000);

      // Schedule exact transitions:
      // A. If event hasn't started yet, schedule a timer for the exact start millisecond
      if (nowMs < startMs) {
        const msUntilStart = startMs - nowMs;
        if (msUntilStart > 0 && msUntilStart <= 24 * 3600 * 1000) {
          const t = window.setTimeout(refreshEventStatuses, msUntilStart + 300);
          eventTimers.push(t);
        }
      }
      // B. If event is currently ongoing, schedule a timer for the exact end millisecond
      else if (nowMs < endMs) {
        const msUntilEnd = endMs - nowMs;
        if (msUntilEnd > 0 && msUntilEnd <= 24 * 3600 * 1000) {
          const t = window.setTimeout(refreshEventStatuses, msUntilEnd + 300);
          eventTimers.push(t);
        }
      }

      if (
        ev.isOngoing !== isOngoing ||
        ev.isPassed !== isPassed ||
        ev.minutesUntil !== minutesUntil
      ) {
        return {
          ...ev,
          isOngoing,
          isPassed,
          minutesUntil,
        };
      }
      return ev;
    });
  };

  const startMinuteTicker = () => {
    if (minuteTicker) return;
    minuteTicker = window.setInterval(refreshEventStatuses, 30_000);
  };

  // Generate lean sample events for immediate testing
  const generateSampleEvents = (): CalendarEvent[] => {
    const now = new Date();
    const todayStr = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    // Event 1: Today, starting in 8 minutes (tests Meeting Radar immediately)
    const e1Start = new Date(now.getTime() + 8 * 60 * 1000);
    const e1End = new Date(e1Start.getTime() + 30 * 60 * 1000);

    // Event 2: Today, in 3 hours
    const e2Start = new Date(now.getTime() + 180 * 60 * 1000);
    const e2End = new Date(e2Start.getTime() + 45 * 60 * 1000);

    // Event 3: Tomorrow at 10:00 AM
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    tomorrow.setHours(10, 0, 0, 0);
    const e3Start = tomorrow;
    const e3End = new Date(tomorrow.getTime() + 45 * 60 * 1000);
    const tomorrowStr = tomorrow.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

    const is12h = timezones.timeFormat === '12h';
    const fmt = (d: Date) => d.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: is12h ? 'numeric' : '2-digit',
      minute: '2-digit',
      hour12: is12h
    });

    const formatRange = (s: Date, e: Date) => {
      const sStr = fmt(s);
      const eStr = fmt(e);
      return `${sStr} - ${eStr}`;
    };

    return [
      {
        id: 'sample-1',
        title: 'Sprint Planning & Architecture Sync',
        startTime: e1Start.toISOString(),
        endTime: e1End.toISOString(),
        startTimeFormatted: fmt(e1Start),
        endTimeFormatted: fmt(e1End),
        location: 'Google Meet',
        description: 'Review weekly sprint milestones and UI progress',
        meetUrl: 'https://meet.google.com/abc-defg-hij',
        isOngoing: false,
        isPassed: false,
        minutesUntil: 8,
        formattedTimeRange: formatRange(e1Start, e1End),
        isToday: true,
        isTomorrow: false,
        dayLabel: 'Today',
        startDateFormatted: todayStr,
      },
      {
        id: 'sample-2',
        title: 'Architecture Review & Check-in',
        startTime: e2Start.toISOString(),
        endTime: e2End.toISOString(),
        startTimeFormatted: fmt(e2Start),
        endTimeFormatted: fmt(e2End),
        location: 'Zoom',
        description: 'Sync on backend API contracts',
        meetUrl: 'https://zoom.us/j/1234567890',
        isOngoing: false,
        isPassed: false,
        minutesUntil: 180,
        formattedTimeRange: formatRange(e2Start, e2End),
        isToday: true,
        isTomorrow: false,
        dayLabel: 'Today',
        startDateFormatted: todayStr,
      },
      {
        id: 'sample-3',
        title: 'Weekly 1:1 Engineering Sync',
        startTime: e3Start.toISOString(),
        endTime: e3End.toISOString(),
        startTimeFormatted: fmt(e3Start),
        endTimeFormatted: fmt(e3End),
        location: 'Google Meet',
        description: 'Roadmap prioritization & review',
        meetUrl: 'https://meet.google.com/xyz-uvwx-rst',
        isOngoing: false,
        isPassed: false,
        minutesUntil: Math.round((e3Start.getTime() - now.getTime()) / 60000),
        formattedTimeRange: formatRange(e3Start, e3End),
        isToday: false,
        isTomorrow: true,
        dayLabel: 'Tomorrow',
        startDateFormatted: tomorrowStr,
      },
    ];
  };

  const TARGET_TIMEZONE = 'Asia/Kolkata';

  const KNOWN_TZ_OFFSETS: Record<string, string> = {
    'india standard time': '+05:30',
    'ist': '+05:30',
    'asia/kolkata': '+05:30',
    'asia/calcutta': '+05:30',
    'utc': '+00:00',
    'gmt': '+00:00',
    'gmt standard time': '+00:00',
    'greenwich standard time': '+00:00',
    'w. europe standard time': '+01:00',
    'central europe standard time': '+01:00',
    'romance standard time': '+01:00',
    'central european standard time': '+01:00',
    'western european standard time': '+00:00',
    'eastern standard time': '-05:00',
    'central standard time': '-06:00',
    'mountain standard time': '-07:00',
    'pacific standard time': '-08:00',
  };

  const parseIcsDate = (val: string, tzid?: string, vtimezoneMap: Record<string, string> = {}): Date | null => {
    try {
      val = val.replace(/^.*:/, '').trim();
      if (/^\d{8}T\d{6}Z?$/.test(val)) {
        const y = val.slice(0, 4);
        const m = val.slice(4, 6);
        const d = val.slice(6, 8);
        const h = val.slice(9, 11);
        const min = val.slice(11, 13);
        const s = val.slice(13, 15);

        // 1. Explicit UTC 'Z' indicator (e.g. 20261124T100000Z)
        if (val.endsWith('Z')) {
          return new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
        }

        const cleanTzid = (tzid || '').replace(/["']/g, '').trim().toLowerCase();

        // 2. Check offsets discovered in the ICS file's VTIMEZONE blocks
        if (cleanTzid && vtimezoneMap[cleanTzid]) {
          return new Date(`${y}-${m}-${d}T${h}:${min}:${s}${vtimezoneMap[cleanTzid]}`);
        }

        // 3. Check known Windows and IANA timezone offsets
        if (cleanTzid && KNOWN_TZ_OFFSETS[cleanTzid]) {
          return new Date(`${y}-${m}-${d}T${h}:${min}:${s}${KNOWN_TZ_OFFSETS[cleanTzid]}`);
        }

        // 4. Try IANA timezone offset calculation via browser's Intl engine
        if (cleanTzid) {
          try {
            const tzYear = parseInt(y, 10);
            const tzMonth = parseInt(m, 10);
            const tzDay = parseInt(d, 10);
            const tzHour = parseInt(h, 10);
            const tzMin = parseInt(min, 10);
            const tzSec = parseInt(s, 10);

            const utcDate = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec));
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: tzid,
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              hour12: false,
            });
            const parts = formatter.formatToParts(utcDate);
            const getPart = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || '0', 10);
            let h1 = getPart('hour');
            if (h1 === 24) h1 = 0;
            const tzAsUtc = Date.UTC(getPart('year'), getPart('month') - 1, getPart('day'), h1, getPart('minute'), getPart('second'));
            const offsetMs = tzAsUtc - utcDate.getTime();
            return new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin, tzSec) - offsetMs);
          } catch {
            // Unrecognized IANA string, proceed to fallback
          }
        }

        // 5. Default fallback for Indian users: assume IST (+05:30)
        return new Date(`${y}-${m}-${d}T${h}:${min}:${s}+05:30`);
      } else if (/^\d{8}$/.test(val)) {
        // All-day event: start of day in IST
        const y = val.slice(0, 4);
        const m = val.slice(4, 6);
        const d = val.slice(6, 8);
        return new Date(`${y}-${m}-${d}T00:00:00+05:30`);
      }
    } catch {
      return null;
    }
    return null;
  };

  const parseIcsText = (icsData: string): CalendarEvent[] => {
    const rawEvents: CalendarEvent[] = [];
    // RFC 5545 unfolding: Lines beginning with space or tab are continuations of the previous line
    const unfolded = icsData
      .replace(/\r\n[ \t]/g, '')
      .replace(/\n[ \t]/g, '')
      .replace(/\r/g, '');
    const lines = unfolded.split('\n');

    // 1. Scan and index all VTIMEZONE blocks in the ICS to get exact offsets
    const vtimezoneMap: Record<string, string> = {};
    let inTz = false;
    let curTzId = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VTIMEZONE') {
        inTz = true;
        curTzId = '';
      } else if (trimmed === 'END:VTIMEZONE') {
        inTz = false;
      } else if (inTz && trimmed.startsWith('TZID:')) {
        curTzId = trimmed.slice(5).replace(/["']/g, '').trim().toLowerCase();
      } else if (inTz && curTzId && trimmed.startsWith('TZOFFSETTO:')) {
        const rawOffset = trimmed.slice(11).trim(); // e.g. +0100, +0530, -0500
        if (/^[+-]\d{4}$/.test(rawOffset)) {
          const sign = rawOffset[0];
          const hrs = rawOffset.slice(1, 3);
          const mins = rawOffset.slice(3, 5);
          vtimezoneMap[curTzId] = `${sign}${hrs}:${mins}`;
        }
      }
    }

    let currentEvent: Record<string, string> = {};

    const formatTime = (d: Date) => {
      const is12h = timezones.timeFormat === '12h';
      return d.toLocaleTimeString('en-US', {
        timeZone: TARGET_TIMEZONE,
        hour: is12h ? 'numeric' : '2-digit',
        minute: '2-digit',
        hour12: is12h,
      });
    };

    const formatDateKey = (d: Date) => {
      return d.toLocaleDateString('en-CA', { timeZone: TARGET_TIMEZONE }); // YYYY-MM-DD
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmed === 'END:VEVENT' && Object.keys(currentEvent).length > 0) {
        // Skip explicitly cancelled events (avoids ghost duplicates when meetings are moved or updated)
        const status = (currentEvent['STATUS'] || '').toUpperCase();
        if (status === 'CANCELLED') {
          currentEvent = {};
          continue;
        }

        const summary = currentEvent['SUMMARY'] || 'Untitled Event';
        const startStr = currentEvent['DTSTART'] || '';
        const startTzid = currentEvent['DTSTART_TZID'] || '';
        const endStr = currentEvent['DTEND'] || startStr;
        const endTzid = currentEvent['DTEND_TZID'] || startTzid;
        const location = currentEvent['LOCATION'] || '';
        const desc = currentEvent['DESCRIPTION'] || '';

        const startDate = parseIcsDate(startStr, startTzid, vtimezoneMap);
        const parsedEndDate = parseIcsDate(endStr, endTzid, vtimezoneMap);

        if (startDate) {
          const finalEndDate = parsedEndDate || startDate;
          const now = new Date();
          const todayKey = formatDateKey(now);
          const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
          const tomorrowKey = formatDateKey(tomorrow);
          const eventDayKey = formatDateKey(startDate);

          const endOfWindow = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

          // Include events from today through 7 days
          if (finalEndDate.getTime() >= (now.getTime() - 24 * 3600 * 1000) && startDate.getTime() <= endOfWindow.getTime()) {
            const minutesUntil = Math.round((startDate.getTime() - now.getTime()) / 60000);
            const isOngoing = now.getTime() >= startDate.getTime() && now.getTime() <= finalEndDate.getTime();
            const isPassed = now.getTime() > finalEndDate.getTime();

            const isToday = eventDayKey === todayKey;
            const isTomorrow = eventDayKey === tomorrowKey;
            const dayLabel = isToday
              ? 'Today'
              : isTomorrow
              ? 'Tomorrow'
              : startDate.toLocaleDateString('en-US', { timeZone: TARGET_TIMEZONE, weekday: 'short', month: 'short', day: 'numeric' });
            const startDateFormatted = startDate.toLocaleDateString('en-US', { timeZone: TARGET_TIMEZONE, weekday: 'long', month: 'short', day: 'numeric' });

            // Extract Google Meet or Zoom URLs
            const textToSearch = `${location} ${desc}`;
            const meetMatch = textToSearch.match(/https:\/\/(meet\.google\.com\/[a-z0-9-]+|.*\.zoom\.us\/j\/[0-9]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s<">]+)/i);

            const formatRange = (s: Date, e: Date) => {
              const sStr = formatTime(s);
              const sDateKey = formatDateKey(s);
              const eDateKey = formatDateKey(e);
              const eStr = sDateKey === eDateKey ? formatTime(e) : '';
              return eStr ? `${sStr} - ${eStr}` : sStr;
            };

            const uid = currentEvent['UID'] || '';
            const normalizedTitle = summary.trim().toLowerCase();
            const startTimeEpoch = startDate.getTime();

            // Intelligent Deduplication:
            // Match against already parsed events with either the same UID+StartTime or same NormalizedTitle+StartTime
            const existingMatch = rawEvents.find((ev) => {
              const evTimeEpoch = new Date(ev.startTime).getTime();
              const isSameTime = Math.abs(evTimeEpoch - startTimeEpoch) < 60000; // Within 1 minute window
              const isSameUid = uid && ev.id === uid;
              const isSameTitle = ev.title.trim().toLowerCase() === normalizedTitle;
              return isSameTime && (isSameUid || isSameTitle);
            });

            if (existingMatch) {
              // Merge richer metadata into existing event if the duplicate has links/details
              if (!existingMatch.meetUrl && meetMatch) {
                existingMatch.meetUrl = meetMatch[0];
              }
              if (!existingMatch.location && location) {
                existingMatch.location = location;
              }
              if (!existingMatch.description && desc) {
                existingMatch.description = desc;
              }
            } else {
              rawEvents.push({
                id: uid || `event-${Date.now()}-${Math.random()}`,
                title: summary,
                startTime: startDate.toISOString(),
                endTime: finalEndDate.toISOString(),
                startTimeFormatted: formatTime(startDate),
                endTimeFormatted: formatTime(finalEndDate),
                location: location || undefined,
                description: desc || undefined,
                meetUrl: meetMatch ? meetMatch[0] : undefined,
                isOngoing,
                isPassed,
                minutesUntil,
                formattedTimeRange: formatRange(startDate, finalEndDate),
                isToday,
                isTomorrow,
                dayLabel,
                startDateFormatted,
              });
            }
          }
        }
        currentEvent = {};
      } else if (trimmed.includes(':')) {
        const idx = trimmed.indexOf(':');
        const keyPart = trimmed.slice(0, idx);
        const val = trimmed.slice(idx + 1);
        const key = keyPart.split(';')[0].toUpperCase();
        currentEvent[key] = val;

        if (keyPart.includes('TZID=')) {
          const tzid = keyPart.split('TZID=')[1].split(';')[0].replace(/["']/g, '');
          currentEvent[`${key}_TZID`] = tzid;
        }
      }
    }

    return rawEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const fetchCalendar = async () => {
    if (useSampleEvents.value) {
      events.value = generateSampleEvents();
      lastSync.value = new Date();
      refreshEventStatuses();
      startMinuteTicker();
      return;
    }

    if (!feedUrl.value || !feedUrl.value.trim()) {
      events.value = [];
      return;
    }

    isLoading.value = true;
    try {
      const bridgeUrl = `/api/calendar/feed?url=${encodeURIComponent(feedUrl.value.trim())}`;
      const res = await fetch(bridgeUrl);
      if (res.ok) {
        const icsText = await res.text();
        events.value = parseIcsText(icsText);
        lastSync.value = new Date();
        refreshEventStatuses();
        startMinuteTicker();
      } else {
        console.warn('Calendar feed fetch failed with HTTP', res.status);
        // If boot occurred before network ready, retry in 10s
        if (events.value.length === 0) {
          window.setTimeout(() => fetchCalendar(), 10_000);
        }
      }
    } catch (e) {
      console.warn('Calendar fetch error:', e);
      // If boot occurred before network ready, retry in 10s
      if (events.value.length === 0) {
        window.setTimeout(() => fetchCalendar(), 10_000);
      }
    } finally {
      isLoading.value = false;
    }
  };

  const setFeedUrl = (url: string) => {
    let clean = url.trim();
    if (clean.startsWith('webcal://')) {
      clean = 'https://' + clean.slice(9);
    }
    feedUrl.value = clean;
    localStorage.setItem(FEED_URL_KEY, feedUrl.value);
    if (feedUrl.value) {
      useSampleEvents.value = false;
      localStorage.setItem(USE_SAMPLE_KEY, 'false');
    }
    fetchCalendar();
  };

  const setUseSampleEvents = (val: boolean) => {
    useSampleEvents.value = val;
    localStorage.setItem(USE_SAMPLE_KEY, String(val));
    fetchCalendar();
  };

  const currentDateFormatted = computed(() => {
    return new Date().toLocaleDateString('en-US', { timeZone: TARGET_TIMEZONE, weekday: 'long', month: 'short', day: 'numeric' });
  });

  const todayEvents = computed(() => {
    return events.value.filter((e) => e.isToday);
  });

  const groupedEvents = computed(() => {
    const groups: { dayKey: string; dateFormatted: string; isToday: boolean; events: CalendarEvent[] }[] = [];
    for (const ev of events.value) {
      let g = groups.find((grp) => grp.dateFormatted === ev.startDateFormatted);
      if (!g) {
        g = {
          dayKey: ev.dayLabel,
          dateFormatted: ev.startDateFormatted,
          isToday: ev.isToday,
          events: [],
        };
        groups.push(g);
      }
      g.events.push(ev);
    }
    return groups;
  });

  const nextUpcomingEvent = computed(() => {
    return events.value.find((e) => !e.isPassed) || null;
  });

  const radarEvent = computed(() => {
    return events.value.find((e) => !e.isPassed && (e.isOngoing || (e.minutesUntil >= 0 && e.minutesUntil <= 30))) || null;
  });

  // Automated Background Polling (Every 30 Minutes)
  const POLL_INTERVAL_MS = 30 * 60 * 1000;
  let pollTimer: number | null = null;

  const startPolling = () => {
    if (pollTimer) return;
    fetchCalendar();
    pollTimer = window.setInterval(() => {
      fetchCalendar();
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
    if (minuteTicker) {
      window.clearInterval(minuteTicker);
      minuteTicker = null;
    }
    eventTimers.forEach((t) => window.clearTimeout(t));
    eventTimers = [];
  };

  // Re-format times whenever the user toggles 12h/24h in Settings
  watch(
    () => timezones.timeFormat,
    () => {
      fetchCalendar();
    }
  );

  // Fetch immediately on store initialization
  fetchCalendar();

  return {
    feedUrl,
    useSampleEvents,
    events,
    isLoading,
    lastSync,
    nextUpcomingEvent,
    radarEvent,
    currentDateFormatted,
    todayEvents,
    groupedEvents,
    fetchCalendar,
    startPolling,
    stopPolling,
    setFeedUrl,
    setUseSampleEvents,
  };
});
