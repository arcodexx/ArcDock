import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface GitHubPrItem {
  id: number;
  title: string;
  repo: string;
  author: string;
  url: string;
  updatedAt: string;
  state?: string;
}

export interface GitHubRepoItem {
  name: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  languageColor?: string;
  url: string;
  pushedAt: string;
  isPrivate: boolean;
}

export interface DailyContribution {
  date: string;
  displayDate: string;
  dayName: string;
  count: number;
  color?: string;
}

export interface GitHubUserProfile {
  login: string;
  name: string;
  avatarUrl: string;
  bio: string;
  location: string;
  followers: number;
  following: number;
  publicRepos: number;
  totalContributionsYear: number;
}

const STORAGE_KEY_TOKEN = 'arcdock_github_token';
const STORAGE_KEY_USER = 'arcdock_github_user';

export const useGitHubStore = defineStore('github', () => {
  const token = ref<string>(localStorage.getItem(STORAGE_KEY_TOKEN) || '');
  const username = ref<string>(localStorage.getItem(STORAGE_KEY_USER) || '');

  const streakDays = ref<number>(0);
  const todayCommits = ref<number>(0);
  const contributionGrid = ref<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const recentContributions = ref<DailyContribution[]>([]);
  const pendingPrs = ref<number>(0);
  const prList = ref<GitHubPrItem[]>([]);
  const topRepos = ref<GitHubRepoItem[]>([]);
  const userProfile = ref<GitHubUserProfile | null>(null);

  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const saveCredentials = (newUser: string, newToken: string) => {
    username.value = newUser.trim();
    token.value = newToken.trim();
    localStorage.setItem(STORAGE_KEY_USER, username.value);
    localStorage.setItem(STORAGE_KEY_TOKEN, token.value);
    fetchData();
  };

  const formatLocalDate = (d: Date = new Date()): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to calculate daily streak from sorted chronological daily contribution list
  const calculateStreak = (days: { date: string; count: number }[]): number => {
    if (!days || days.length === 0) return 0;
    
    // Sort descending by date (most recent first)
    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date));
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterdayDate);

    let streak = 0;
    let expectedDate = todayStr;

    // If today has 0 commits, allow streak to continue from yesterday
    const todayEntry = sorted.find((d) => d.date === todayStr);
    if (!todayEntry || todayEntry.count === 0) {
      expectedDate = yesterdayStr;
    }

    for (const d of sorted) {
      if (d.date > expectedDate) continue; // skip future days if any
      if (d.date === expectedDate) {
        if (d.count > 0) {
          streak++;
          // Decrement expectedDate by 1 day using local date
          const [y, m, dt] = expectedDate.split('-').map(Number);
          const prevDate = new Date(y, m - 1, dt - 1);
          expectedDate = formatLocalDate(prevDate);
        } else {
          break;
        }
      } else {
        // Missing consecutive day
        break;
      }
    }

    return streak;
  };

  // Fetch using official GraphQL API when Token is available
  const fetchWithGraphQL = async () => {
    const query = `
      query($login: String!) {
        user(login: $login) {
          name
          login
          avatarUrl
          bio
          location
          followers { totalCount }
          following { totalCount }
          repositories(first: 6, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: OWNER) {
            nodes {
              name
              description
              stargazerCount
              forkCount
              primaryLanguage { name color }
              url
              pushedAt
              isPrivate
            }
          }
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                  color
                }
              }
            }
          }
        }
      }
    `;

    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.value}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { login: username.value } }),
    });

    if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.statusText}`);
    const data = await res.json();
    if (data.errors && data.errors.length > 0) {
      throw new Error(data.errors[0].message);
    }

    const usr = data.data?.user;
    if (!usr) return false;

    // Profile
    userProfile.value = {
      login: usr.login,
      name: usr.name || usr.login,
      avatarUrl: usr.avatarUrl,
      bio: usr.bio || '',
      location: usr.location || '',
      followers: usr.followers?.totalCount || 0,
      following: usr.following?.totalCount || 0,
      publicRepos: usr.repositories?.nodes?.length || 0,
      totalContributionsYear: usr.contributionsCollection?.contributionCalendar?.totalContributions || 0,
    };

    // Repos
    if (usr.repositories?.nodes) {
      topRepos.value = usr.repositories.nodes.map((r: any) => ({
        name: r.name,
        description: r.description || '',
        stars: r.stargazerCount,
        forks: r.forkCount,
        language: r.primaryLanguage?.name || 'Code',
        languageColor: r.primaryLanguage?.color || '#3b82f6',
        url: r.url,
        pushedAt: new Date(r.pushedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        isPrivate: r.isPrivate,
      }));
    }

    // Contribution Calendar
    const weeks = usr.contributionsCollection?.contributionCalendar?.weeks || [];
    const allDays: { date: string; contributionCount: number; color?: string }[] = [];
    for (const w of weeks) {
      if (w.contributionDays) {
        for (const cd of w.contributionDays) {
          allDays.push({
            date: cd.date,
            contributionCount: cd.contributionCount,
            color: cd.color,
          });
        }
      }
    }

    // Extract last 14 days
    const last14 = allDays.slice(-14);
    contributionGrid.value = last14.map((d) => d.contributionCount);
    
    // Format rich recent days
    recentContributions.value = last14.map((d) => {
      const dt = new Date(d.date + 'T00:00:00Z');
      return {
        date: d.date,
        displayDate: dt.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        dayName: dt.toLocaleDateString([], { weekday: 'narrow' }),
        count: d.contributionCount,
        color: d.color,
      };
    });

    // Today's commits
    const nowIso = formatLocalDate(new Date());
    const todayMatch = allDays.find((d) => d.date === nowIso);
    todayCommits.value = todayMatch?.contributionCount || (last14[last14.length - 1]?.contributionCount || 0);

    // Calculate real streak
    streakDays.value = calculateStreak(allDays.map((d) => ({ date: d.date, count: d.contributionCount })));

    return true;
  };

  // Fetch using REST APIs (public endpoints, works even without token)
  const fetchWithRest = async () => {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`;
    }

    // 1. Fetch User Profile
    try {
      const userRes = await fetch(`https://api.github.com/users/${username.value}`, { headers });
      if (userRes.ok) {
        const u = await userRes.json();
        userProfile.value = {
          login: u.login,
          name: u.name || u.login,
          avatarUrl: u.avatar_url,
          bio: u.bio || '',
          location: u.location || '',
          followers: u.followers || 0,
          following: u.following || 0,
          publicRepos: u.public_repos || 0,
          totalContributionsYear: userProfile.value?.totalContributionsYear || 0,
        };
      }
    } catch (e) {
      console.warn('[GitHub] REST user fetch failed:', e);
    }

    // 2. Fetch User Recent Repositories
    try {
      const reposRes = await fetch(`https://api.github.com/users/${username.value}/repos?sort=pushed&per_page=6`, { headers });
      if (reposRes.ok) {
        const rList = await reposRes.json();
        if (Array.isArray(rList)) {
          topRepos.value = rList.map((r: any) => ({
            name: r.name,
            description: r.description || '',
            stars: r.stargazers_count || 0,
            forks: r.forks_count || 0,
            language: r.language || 'Code',
            languageColor: '#3b82f6',
            url: r.html_url,
            pushedAt: new Date(r.pushed_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            isPrivate: r.private || false,
          }));
        }
      }
    } catch (e) {
      console.warn('[GitHub] REST repos fetch failed:', e);
    }

    // 3. Calculate 14-day activity from official GitHub events API
    try {
      const eventsRes = await fetch(`https://api.github.com/users/${username.value}/events?per_page=100`, { headers });
      if (eventsRes.ok) {
        const events = await eventsRes.json();
        const now = new Date();
        const todayStr = formatLocalDate(now);
        let commitCount = 0;

        const grid = new Array(14).fill(0);
        const daysMap: Record<string, number> = {};
        const dailyItems: { date: string; count: number }[] = [];

        for (let i = 0; i < 14; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (13 - i));
          const key = formatLocalDate(d);
          daysMap[key] = i;
          dailyItems.push({ date: key, count: 0 });
        }

        if (Array.isArray(events)) {
          for (const ev of events) {
            if (!ev.created_at) continue;
            const eventDate = new Date(ev.created_at);
            const dateKey = formatLocalDate(eventDate);
            const count = ev.type === 'PushEvent' ? (ev.payload?.commits?.length || 1) : 1;

            if (ev.type === 'PushEvent' && dateKey === todayStr) {
              commitCount += count;
            }

            if (dateKey && daysMap[dateKey] !== undefined) {
              grid[daysMap[dateKey]] += count;
              dailyItems[daysMap[dateKey]].count += count;
            }
          }
        }

        todayCommits.value = commitCount;
        contributionGrid.value = grid;
        recentContributions.value = dailyItems.map((d) => {
          const [y, m, dt] = d.date.split('-').map(Number);
          const localD = new Date(y, m - 1, dt);
          return {
            date: d.date,
            displayDate: localD.toLocaleDateString([], { month: 'short', day: 'numeric' }),
            dayName: localD.toLocaleDateString([], { weekday: 'narrow' }),
            count: d.count,
          };
        });

        streakDays.value = calculateStreak(dailyItems);
      }
    } catch (e) {
      console.warn('[GitHub] Official events fetch failed:', e);
    }
  };

  const fetchData = async () => {
    if (!username.value) return;

    isLoading.value = true;
    error.value = null;

    try {
      let success = false;
      // Try official GraphQL first if token is available
      if (token.value) {
        try {
          success = await fetchWithGraphQL();
        } catch (e) {
          console.warn('[GitHub] GraphQL failed, falling back to REST:', e);
        }
      }

      // If no token or GraphQL failed, use REST
      if (!success) {
        await fetchWithRest();
      }

      // Fetch open Pull Requests (authored & review-requested)
      const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
      if (token.value) headers.Authorization = `Bearer ${token.value}`;

      const [authoredRes, reviewRes] = await Promise.allSettled([
        fetch(`https://api.github.com/search/issues?q=type:pr+state:open+author:${username.value}`, { headers }),
        fetch(`https://api.github.com/search/issues?q=type:pr+state:open+review-requested:${username.value}`, { headers }),
      ]);

      const itemsMap = new Map<number, any>();

      if (authoredRes.status === 'fulfilled' && authoredRes.value.ok) {
        const authoredData = await authoredRes.value.json();
        if (authoredData.items && Array.isArray(authoredData.items)) {
          for (const it of authoredData.items) {
            itemsMap.set(it.id, it);
          }
        }
      }

      if (reviewRes.status === 'fulfilled' && reviewRes.value.ok) {
        const reviewData = await reviewRes.value.json();
        if (reviewData.items && Array.isArray(reviewData.items)) {
          for (const it of reviewData.items) {
            itemsMap.set(it.id, it);
          }
        }
      }

      pendingPrs.value = itemsMap.size;
      prList.value = Array.from(itemsMap.values()).slice(0, 10).map((it: any) => ({
        id: it.id,
        title: it.title,
        repo: it.repository_url?.split('/').slice(-2).join('/') || 'repo',
        author: it.user?.login || 'user',
        url: it.html_url,
        updatedAt: new Date(it.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        state: it.state,
      }));
    } catch (err: any) {
      console.warn('[GitHub] Global fetch error:', err);
      error.value = 'Failed to load GitHub data.';
      // If boot occurred before network ready, retry in 10s
      if (todayCommits.value === 0 && streakDays.value === 0 && username.value) {
        window.setTimeout(() => fetchData(), 10_000);
      }
    } finally {
      isLoading.value = false;
    }
  };

  // Automated Background Polling (Every 1 Hour)
  const POLL_INTERVAL_MS = 60 * 60 * 1000;
  let pollTimer: number | null = null;

  const startPolling = () => {
    if (pollTimer) return;
    if (username.value) {
      fetchData();
    }
    pollTimer = window.setInterval(() => {
      if (username.value) {
        fetchData();
      }
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  if (username.value) {
    fetchData();
  }

  return {
    token,
    username,
    streakDays,
    todayCommits,
    contributionGrid,
    recentContributions,
    pendingPrs,
    prList,
    topRepos,
    userProfile,
    isLoading,
    error,
    saveCredentials,
    fetchData,
    startPolling,
    stopPolling,
  };
});
