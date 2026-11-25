import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  Connection,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
} from 'home-assistant-js-websocket';
import type { HassEntities, ConnectionStatus, RoomSyncConfig } from '@/types/homeAssistant';

const STORAGE_KEY_URL = 'arcdock_ha_url';
const STORAGE_KEY_TOKEN = 'arcdock_ha_token';
const STORAGE_KEY_ROOM_SYNC = 'arcdock_ha_room_sync';

const loadRoomSyncConfig = (): RoomSyncConfig => {
  const raw = localStorage.getItem(STORAGE_KEY_ROOM_SYNC);
  try {
    return raw ? JSON.parse(raw) : { enabled: false, targetEntityIds: [] };
  } catch {
    return { enabled: false, targetEntityIds: [] };
  }
};

const loadPinnedEntityIds = (): string[] => {
  const raw = localStorage.getItem('arcdock_ha_pinned');
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const useHomeAssistantStore = defineStore('homeAssistant', () => {
  const haUrl = ref<string>(localStorage.getItem(STORAGE_KEY_URL) || 'http://127.0.0.1:8123');
  const haToken = ref<string>(localStorage.getItem(STORAGE_KEY_TOKEN) || '');

  const connectionStatus = ref<ConnectionStatus>('disconnected');
  const errorMessage = ref<string | null>(null);
  const activeSceneId = ref<string | null>(null);

  const entities = ref<HassEntities>({});

  let connection: Connection | null = null;
  let unsubscribeEntities: (() => void) | null = null;

  const isConnected = computed(() => connectionStatus.value === 'connected');

  const lights = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('light.'));
  });

  const switches = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('switch.'));
  });

  const scenes = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('scene.'));
  });

  const climates = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('climate.'));
  });

  const roomSyncConfig = ref<RoomSyncConfig>(loadRoomSyncConfig());
  const pinnedEntityIds = ref<string[]>(loadPinnedEntityIds());

  const setPinnedEntities = (ids: string[]) => {
    pinnedEntityIds.value = ids;
    localStorage.setItem('arcdock_ha_pinned', JSON.stringify(ids));
  };

  const setRoomSyncConfig = (config: Partial<RoomSyncConfig>) => {
    roomSyncConfig.value = {
      ...roomSyncConfig.value,
      ...config,
    };
    localStorage.setItem(STORAGE_KEY_ROOM_SYNC, JSON.stringify(roomSyncConfig.value));
  };

  const setConfig = (url: string, token: string) => {
    haUrl.value = url.trim();
    haToken.value = token.trim();
    localStorage.setItem(STORAGE_KEY_URL, haUrl.value);
    localStorage.setItem(STORAGE_KEY_TOKEN, haToken.value);
    connect();
  };

  const connect = async () => {
    if (!haUrl.value || !haToken.value) {
      connectionStatus.value = 'disconnected';
      errorMessage.value = 'Missing Home Assistant URL or Long-Lived Access Token.';
      return;
    }

    disconnect();
    connectionStatus.value = 'connecting';
    errorMessage.value = null;

    try {
      const auth = createLongLivedTokenAuth(haUrl.value, haToken.value);
      connection = await createConnection({ auth });
      connectionStatus.value = 'connected';

      connection.addEventListener('disconnected', () => {
        connectionStatus.value = 'disconnected';
      });

      connection.addEventListener('ready', () => {
        connectionStatus.value = 'connected';
      });

      unsubscribeEntities = subscribeEntities(connection, (newEntities) => {
        entities.value = newEntities;
      });
    } catch (err: any) {
      connectionStatus.value = 'error';
      if (err === ERR_CANNOT_CONNECT) {
        errorMessage.value = 'Unable to connect to Home Assistant at ' + haUrl.value;
      } else if (err === ERR_INVALID_AUTH) {
        errorMessage.value = 'Invalid Long-Lived Access Token.';
      } else {
        errorMessage.value = err?.message || 'Connection failed.';
      }
    }
  };

  const disconnect = () => {
    if (unsubscribeEntities) {
      unsubscribeEntities();
      unsubscribeEntities = null;
    }
    if (connection) {
      connection.close();
      connection = null;
    }
    connectionStatus.value = 'disconnected';
  };

  // Light actions
  const toggleLight = async (entityId: string) => {
    if (connection) {
      try {
        await callService(connection, 'light', 'toggle', { entity_id: entityId });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to toggle light:', e);
      }
    }
  };

  const setBrightness = async (entityId: string, percent: number) => {
    if (connection) {
      const clampedPercent = Math.max(0, Math.min(100, percent));
      const rawBrightness = Math.round((clampedPercent / 100) * 255);

      try {
        if (rawBrightness === 0) {
          await callService(connection, 'light', 'turn_off', { entity_id: entityId });
        } else {
          await callService(connection, 'light', 'turn_on', {
            entity_id: entityId,
            brightness: rawBrightness,
          });
        }
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to set brightness:', e);
      }
    }
  };

  // Switch actions
  const toggleSwitch = async (entityId: string) => {
    if (connection) {
      try {
        await callService(connection, 'switch', 'toggle', { entity_id: entityId });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to toggle switch:', e);
      }
    }
  };

  // Scene actions
  const activateScene = async (sceneId: string) => {
    activeSceneId.value = sceneId;
    setTimeout(() => {
      if (activeSceneId.value === sceneId) {
        activeSceneId.value = null;
      }
    }, 1200);

    if (connection) {
      try {
        await callService(connection, 'scene', 'turn_on', { entity_id: sceneId });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to activate scene:', e);
      }
    }
  };

  // Climate actions
  const setTemperature = async (entityId: string, temperature: number) => {
    const entity = entities.value[entityId];
    if (!entity) return;

    const minTemp = entity.attributes.min_temp ?? 16;
    const maxTemp = entity.attributes.max_temp ?? 30;
    const step = entity.attributes.target_temp_step ?? 0.5;
    const rounded = Math.round(temperature / step) * step;
    const clampedTemp = Math.max(minTemp, Math.min(maxTemp, Number(rounded.toFixed(1))));

    if (connection) {
      try {
        await callService(connection, 'climate', 'set_temperature', {
          entity_id: entityId,
          temperature: clampedTemp,
        });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to set temperature:', e);
      }
    }
  };

  const setHvacMode = async (entityId: string, hvacMode: string) => {
    if (connection) {
      try {
        await callService(connection, 'climate', 'set_hvac_mode', {
          entity_id: entityId,
          hvac_mode: hvacMode,
        });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to set HVAC mode:', e);
      }
    }
  };

  const setFanMode = async (entityId: string, fanMode: string) => {
    if (connection) {
      try {
        await callService(connection, 'climate', 'set_fan_mode', {
          entity_id: entityId,
          fan_mode: fanMode,
        });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to set fan mode:', e);
      }
    }
  };

  // Dynamic Room Lights Sync to Spotify Album Art RGB
  const syncLightsToColor = async (rgb: [number, number, number]) => {
    if (!roomSyncConfig.value.enabled) return;

    const targets = roomSyncConfig.value.targetEntityIds;
    if (!targets || targets.length === 0) return;

    // Only dispatch if the light is ALREADY ON!
    const activeTargets = targets.filter((entityId) => {
      const entity = entities.value[entityId];
      return entity && entity.state === 'on';
    });

    if (activeTargets.length === 0) return;

    if (connection) {
      try {
        await callService(connection, 'light', 'turn_on', {
          entity_id: activeTargets,
          rgb_color: rgb,
          transition: 2,
        });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to sync lights to album art:', e);
      }
    }
  };

  const restartHomeAssistant = async () => {
    if (connection) {
      await callService(connection, 'homeassistant', 'restart');
    }
  };

  return {
    haUrl,
    haToken,
    connectionStatus,
    errorMessage,
    activeSceneId,
    entities,
    isConnected,
    lights,
    switches,
    scenes,
    climates,
    roomSyncConfig,
    pinnedEntityIds,
    setConfig,
    setRoomSyncConfig,
    setPinnedEntities,
    connect,
    disconnect,
    toggleLight,
    setBrightness,
    toggleSwitch,
    activateScene,
    setTemperature,
    setHvacMode,
    setFanMode,
    syncLightsToColor,
    restartHomeAssistant,
  };
});
