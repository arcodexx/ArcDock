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
import { isDemoMode } from '@/composables/useDemo';

const STORAGE_KEY_URL = 'arcdock_ha_url';
const STORAGE_KEY_TOKEN = 'arcdock_ha_token';
const STORAGE_KEY_ROOM_SYNC = 'arcdock_ha_room_sync';

export const DEFAULT_MOCK_ENTITIES: HassEntities = {
  'climate.bedroom_ac': {
    entity_id: 'climate.bedroom_ac',
    state: 'cool',
    attributes: {
      friendly_name: 'Smart Desk AC',
      current_temperature: 24,
      temperature: 23,
      hvac_modes: ['cool', 'fan_only', 'dry', 'off'],
      fan_modes: ['auto', 'low', 'medium', 'high'],
      fan_mode: 'medium',
      hvac_action: 'cooling',
      min_temp: 16,
      max_temp: 30,
      target_temp_step: 0.5,
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'light.desk_lamp': {
    entity_id: 'light.desk_lamp',
    state: 'on',
    attributes: {
      friendly_name: 'Desk Task Lamp',
      brightness: 215,
      supported_color_modes: ['brightness', 'color_temp'],
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'light.screen_bar': {
    entity_id: 'light.screen_bar',
    state: 'on',
    attributes: {
      friendly_name: 'Monitor Light Bar',
      brightness: 180,
      supported_color_modes: ['brightness'],
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'light.ambient_strip': {
    entity_id: 'light.ambient_strip',
    state: 'on',
    attributes: {
      friendly_name: 'Ambient LED Strip',
      brightness: 140,
      supported_color_modes: ['rgb', 'brightness'],
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'switch.desk_fan': {
    entity_id: 'switch.desk_fan',
    state: 'off',
    attributes: {
      friendly_name: 'Desk Fan',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'scene.focus': {
    entity_id: 'scene.focus',
    state: 'scening',
    attributes: {
      friendly_name: 'Focus',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'scene.relax': {
    entity_id: 'scene.relax',
    state: 'scening',
    attributes: {
      friendly_name: 'Relax & Warm',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
  'scene.night': {
    entity_id: 'scene.night',
    state: 'scening',
    attributes: {
      friendly_name: 'Night Mode',
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  },
};

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

  const isMockMode = ref<boolean>(isDemoMode());

  const connectionStatus = ref<ConnectionStatus>(
    isMockMode.value ? 'connected' : 'disconnected'
  );
  const errorMessage = ref<string | null>(null);
  const activeSceneId = ref<string | null>(null);

  const entities = ref<HassEntities>(
    isMockMode.value ? JSON.parse(JSON.stringify(DEFAULT_MOCK_ENTITIES)) : {}
  );

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
    if (isMockMode.value) {
      connectionStatus.value = 'connected';
      errorMessage.value = null;
      if (Object.keys(entities.value).length === 0) {
        entities.value = JSON.parse(JSON.stringify(DEFAULT_MOCK_ENTITIES));
      }
      return;
    }

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
    if (!isMockMode.value) {
      connectionStatus.value = 'disconnected';
    }
  };

  // Light actions
  const toggleLight = async (entityId: string) => {
    if (isMockMode.value) {
      const e = entities.value[entityId];
      if (e) {
        e.state = e.state === 'on' ? 'off' : 'on';
      }
      return;
    }
    if (connection) {
      try {
        await callService(connection, 'light', 'toggle', { entity_id: entityId });
      } catch (e: any) {
        console.error('[ArcDock HA] Failed to toggle light:', e);
      }
    }
  };

  const setBrightness = async (entityId: string, percent: number) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const rawBrightness = Math.round((clampedPercent / 100) * 255);

    if (isMockMode.value) {
      const e = entities.value[entityId];
      if (e) {
        e.attributes.brightness = rawBrightness;
        e.state = rawBrightness === 0 ? 'off' : 'on';
      }
      return;
    }

    if (connection) {
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
    if (isMockMode.value) {
      const e = entities.value[entityId];
      if (e) {
        e.state = e.state === 'on' ? 'off' : 'on';
      }
      return;
    }

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

    if (isMockMode.value) {
      if (sceneId === 'scene.all_off') {
        Object.values(entities.value).forEach((e) => {
          if (e.entity_id.startsWith('light.') || e.entity_id.startsWith('switch.')) {
            e.state = 'off';
          }
        });
      } else if (sceneId === 'scene.focus') {
        if (entities.value['light.desk_lamp']) {
          entities.value['light.desk_lamp'].state = 'on';
          entities.value['light.desk_lamp'].attributes.brightness = 255;
        }
        if (entities.value['light.screen_bar']) {
          entities.value['light.screen_bar'].state = 'on';
          entities.value['light.screen_bar'].attributes.brightness = 230;
        }
        if (entities.value['climate.bedroom_ac']) {
          entities.value['climate.bedroom_ac'].attributes.temperature = 22;
        }
      } else if (sceneId === 'scene.relax') {
        if (entities.value['light.desk_lamp']) entities.value['light.desk_lamp'].state = 'off';
        if (entities.value['light.ambient_strip']) {
          entities.value['light.ambient_strip'].state = 'on';
          entities.value['light.ambient_strip'].attributes.brightness = 120;
        }
      } else if (sceneId === 'scene.night') {
        Object.values(entities.value).forEach((e) => {
          if (e.entity_id.startsWith('light.')) e.state = 'off';
        });
        if (entities.value['climate.bedroom_ac']) {
          entities.value['climate.bedroom_ac'].attributes.temperature = 24;
        }
      }
      return;
    }

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

    if (isMockMode.value) {
      entity.attributes.temperature = clampedTemp;
      return;
    }

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
    if (isMockMode.value) {
      const e = entities.value[entityId];
      if (e) {
        e.state = hvacMode;
      }
      return;
    }

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
    if (isMockMode.value) {
      const e = entities.value[entityId];
      if (e) {
        e.attributes.fan_mode = fanMode;
      }
      return;
    }

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
    isMockMode,
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
