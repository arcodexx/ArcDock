import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
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

  const storedUrl = localStorage.getItem(FEED_URL_KEY) || '';
  const storedSample = localStorage.getItem(USE_SAMPLE_KEY);

  const feedUrl = ref<string>(storedUrl);
  // Default to sample mode only if user has not configured a feed URL
  const useSampleEvents = ref<boolean>(storedSample !== null ? storedSample === 'true' : !storedUrl);
  const events = ref<CalendarEvent[]>([]);
  const isLoading = ref<boolean>(false);
  const lastSync = ref<Date | null>(null);

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

    const formatRange = (s: Date, e: Date) => {
      const sStr = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const eStr = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${sStr} - ${eStr}`;
    };

    return [
      {
        id: 'sample-1',
        title: 'Sprint Planning & Architecture Sync',
        startTime: e1Start.toISOString(),
        endTime: e1End.toISOString(),
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

  const parseIcsDate = (val: string): Date | null => {
    try {
      val = val.replace(/^.*:/, '').trim();
      if (/^\d{8}T\d{6}Z?$/.test(val)) {
        const y = parseInt(val.slice(0, 4), 10);
        const m = parseInt(val.slice(4, 6), 10) - 1;
        const d = parseInt(val.slice(6, 8), 10);
        const h = parseInt(val.slice(9, 11), 10);
        const min = parseInt(val.slice(11, 13), 10);
        const s = parseInt(val.slice(13, 15), 10);
        if (val.endsWith('Z')) {
          return new Date(Date.UTC(y, m, d, h, min, s));
        }
        return new Date(y, m, d, h, min, s);
      } else if (/^\d{8}$/.test(val)) {
        const y = parseInt(val.slice(0, 4), 10);
        const m = parseInt(val.slice(4, 6), 10) - 1;
        const d = parseInt(val.slice(6, 8), 10);
        return new Date(y, m, d, 0, 0, 0);
      }
    } catch {
      return null;
    }
    return null;
  };

  const parseIcsText = (icsData: string): CalendarEvent[] => {
    const rawEvents: CalendarEvent[] = [];
    const lines = icsData.replace(/\r\n\s+/g, '').replace(/\r/g, '').split('\n');
    let currentEvent: Record<string, string> | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmed === 'END:VEVENT' && currentEvent) {
        const summary = currentEvent['SUMMARY'] || 'Untitled Event';
        const startStr = currentEvent['DTSTART'] || '';
        const endStr = currentEvent['DTEND'] || startStr;
        const location = currentEvent['LOCATION'] || '';
        const desc = currentEvent['DESCRIPTION'] || '';

        const startDate = parseIcsDate(startStr);
        const parsedEndDate = parseIcsDate(endStr);

        if (startDate) {
          const finalEndDate = parsedEndDate || startDate;
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          const endOfWindow = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // 7-day lookahead

          // Include events from today through 7 days
          if (finalEndDate.getTime() >= startOfToday.getTime() && startDate.getTime() <= endOfWindow.getTime()) {
            const minutesUntil = Math.round((startDate.getTime() - now.getTime()) / 60000);
            const isOngoing = now.getTime() >= startDate.getTime() && now.getTime() <= finalEndDate.getTime();
            const isPassed = now.getTime() > finalEndDate.getTime();

            const isToday = startDate.toDateString() === now.toDateString();
            const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
            const isTomorrow = startDate.toDateString() === tomorrow.toDateString();
            const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : startDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
            const startDateFormatted = startDate.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

            // Extract Google Meet or Zoom URLs
            const textToSearch = `${location} ${desc}`;
            const meetMatch = textToSearch.match(/https:\/\/(meet\.google\.com\/[a-z0-9-]+|.*\.zoom\.us\/j\/[0-9]+|teams\.microsoft\.com\/l\/meetup-join\/[^\s<">]+)/i);

            const formatRange = (s: Date, e: Date) => {
              const sStr = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const eStr = s.toDateString() === e.toDateString()
                ? e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';
              return eStr ? `${sStr} - ${eStr}` : sStr;
            };

            rawEvents.push({
              id: currentEvent['UID'] || `event-${Date.now()}-${Math.random()}`,
              title: summary,
              startTime: startDate.toISOString(),
              endTime: finalEndDate.toISOString(),
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
        currentEvent = null;
      } else if (currentEvent && trimmed.includes(':')) {
        const idx = trimmed.indexOf(':');
        const key = trimmed.slice(0, idx).split(';')[0].toUpperCase();
        const val = trimmed.slice(idx + 1);
        currentEvent[key] = val;
      }
    }

    return rawEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  };

  const fetchCalendar = async () => {
    if (useSampleEvents.value) {
      events.value = generateSampleEvents();
      lastSync.value = new Date();
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
      } else {
        console.warn('Calendar feed fetch failed with HTTP', res.status);
      }
    } catch (e) {
      console.warn('Calendar fetch error:', e);
    } finally {
      isLoading.value = false;
    }
  };

  const setFeedUrl = (url: string) => {
    feedUrl.value = url.trim();
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
    return new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
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
    setFeedUrl,
    setUseSampleEvents,
  };
});
