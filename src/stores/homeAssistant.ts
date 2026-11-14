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
import type { HassEntities, ConnectionStatus } from '@/types/homeAssistant';

const STORAGE_KEY_URL = 'arcdock_ha_url';
const STORAGE_KEY_TOKEN = 'arcdock_ha_token';
const STORAGE_KEY_MOCK = 'arcdock_ha_mock';

const INITIAL_MOCK_ENTITIES: HassEntities = {
  'light.desk_lamp': {
    entity_id: 'light.desk_lamp',
    state: 'on',
    attributes: {
      friendly_name: 'Desk Lamp',
      brightness: 200,
      supported_color_modes: ['brightness'],
    },
  },
  'light.screen_bar': {
    entity_id: 'light.screen_bar',
    state: 'on',
    attributes: {
      friendly_name: 'Screen Lightbar',
      brightness: 255,
      supported_color_modes: ['brightness'],
    },
  },
  'light.ambient_strip': {
    entity_id: 'light.ambient_strip',
    state: 'off',
    attributes: {
      friendly_name: 'RGB Ambient Strip',
      brightness: 140,
      supported_color_modes: ['brightness', 'rgb'],
    },
  },
  'switch.desk_fan': {
    entity_id: 'switch.desk_fan',
    state: 'off',
    attributes: {
      friendly_name: 'Desk Fan',
    },
  },
  'scene.focus': {
    entity_id: 'scene.focus',
    state: 'scening',
    attributes: {
      friendly_name: 'Focus',
    },
  },
  'scene.relax': {
    entity_id: 'scene.relax',
    state: 'scening',
    attributes: {
      friendly_name: 'Relax & Warm',
    },
  },
  'scene.night': {
    entity_id: 'scene.night',
    state: 'scening',
    attributes: {
      friendly_name: 'Night Mode',
    },
  },
};

export const useHomeAssistantStore = defineStore('homeAssistant', () => {
  const haUrl = ref<string>(localStorage.getItem(STORAGE_KEY_URL) || 'http://127.0.0.1:8123');
  const haToken = ref<string>(localStorage.getItem(STORAGE_KEY_TOKEN) || '');
  
  // Default to Mock Mode if not explicitly set to false
  const savedMockSetting = localStorage.getItem(STORAGE_KEY_MOCK);
  const isMockMode = ref<boolean>(savedMockSetting !== null ? savedMockSetting === 'true' : true);

  const connectionStatus = ref<ConnectionStatus>(isMockMode.value ? 'mock' : 'disconnected');
  const errorMessage = ref<string | null>(null);
  const activeSceneId = ref<string | null>(null);

  const entities = ref<HassEntities>(JSON.parse(JSON.stringify(INITIAL_MOCK_ENTITIES)));

  let connection: Connection | null = null;
  let unsubscribeEntities: (() => void) | null = null;

  const isConnected = computed(() => connectionStatus.value === 'connected' || connectionStatus.value === 'mock');

  const lights = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('light.'));
  });

  const switches = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('switch.'));
  });

  const scenes = computed(() => {
    return Object.values(entities.value).filter((e) => e.entity_id.startsWith('scene.'));
  });

  const setMockMode = (enabled: boolean) => {
    isMockMode.value = enabled;
    localStorage.setItem(STORAGE_KEY_MOCK, String(enabled));
    if (enabled) {
      disconnect();
      entities.value = JSON.parse(JSON.stringify(INITIAL_MOCK_ENTITIES));
      connectionStatus.value = 'mock';
      errorMessage.value = null;
    } else {
      connectionStatus.value = 'disconnected';
      connect();
    }
  };

  const setConfig = (url: string, token: string) => {
    haUrl.value = url.trim();
    haToken.value = token.trim();
    localStorage.setItem(STORAGE_KEY_URL, haUrl.value);
    localStorage.setItem(STORAGE_KEY_TOKEN, haToken.value);

    if (!isMockMode.value) {
      connect();
    }
  };

  const connect = async () => {
    if (isMockMode.value) {
      connectionStatus.value = 'mock';
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
        if (!isMockMode.value) {
          connectionStatus.value = 'disconnected';
        }
      });

      connection.addEventListener('ready', () => {
        if (!isMockMode.value) {
          connectionStatus.value = 'connected';
        }
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
    const entity = entities.value[entityId];
    if (!entity) return;

    if (isMockMode.value) {
      const isNowOn = entity.state !== 'on';
      entity.state = isNowOn ? 'on' : 'off';
      if (isNowOn && (!entity.attributes.brightness || entity.attributes.brightness === 0)) {
        entity.attributes.brightness = 255;
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
    const entity = entities.value[entityId];
    if (!entity) return;

    const clampedPercent = Math.max(0, Math.min(100, percent));
    const rawBrightness = Math.round((clampedPercent / 100) * 255);

    if (isMockMode.value) {
      entity.attributes.brightness = rawBrightness;
      entity.state = rawBrightness > 0 ? 'on' : 'off';
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
    const entity = entities.value[entityId];
    if (!entity) return;

    if (isMockMode.value) {
      entity.state = entity.state === 'on' ? 'off' : 'on';
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
      if (sceneId === 'scene.focus') {
        if (entities.value['light.desk_lamp']) {
          entities.value['light.desk_lamp'].state = 'on';
          entities.value['light.desk_lamp'].attributes.brightness = 255;
        }
        if (entities.value['light.screen_bar']) {
          entities.value['light.screen_bar'].state = 'on';
          entities.value['light.screen_bar'].attributes.brightness = 255;
        }
        if (entities.value['light.ambient_strip']) {
          entities.value['light.ambient_strip'].state = 'off';
        }
      } else if (sceneId === 'scene.relax') {
        if (entities.value['light.desk_lamp']) {
          entities.value['light.desk_lamp'].state = 'on';
          entities.value['light.desk_lamp'].attributes.brightness = 90;
        }
        if (entities.value['light.screen_bar']) {
          entities.value['light.screen_bar'].state = 'on';
          entities.value['light.screen_bar'].attributes.brightness = 60;
        }
        if (entities.value['light.ambient_strip']) {
          entities.value['light.ambient_strip'].state = 'on';
          entities.value['light.ambient_strip'].attributes.brightness = 180;
        }
      } else if (sceneId === 'scene.night') {
        if (entities.value['light.desk_lamp']) entities.value['light.desk_lamp'].state = 'off';
        if (entities.value['light.screen_bar']) entities.value['light.screen_bar'].state = 'off';
        if (entities.value['switch.desk_fan']) entities.value['switch.desk_fan'].state = 'off';
        if (entities.value['light.ambient_strip']) {
          entities.value['light.ambient_strip'].state = 'on';
          entities.value['light.ambient_strip'].attributes.brightness = 30;
        }
      } else if (sceneId === 'scene.all_off') {
        lights.value.forEach((l) => (l.state = 'off'));
        switches.value.forEach((s) => (s.state = 'off'));
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
    setMockMode,
    setConfig,
    connect,
    disconnect,
    toggleLight,
    setBrightness,
    toggleSwitch,
    activateScene,
  };
});
