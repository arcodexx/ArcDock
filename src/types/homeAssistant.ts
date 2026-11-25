export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface HassEntityAttributes {
  friendly_name?: string;
  brightness?: number; // 0 to 255
  color_temp?: number;
  rgb_color?: [number, number, number];
  icon?: string;
  supported_color_modes?: string[];
  // Climate attributes
  current_temperature?: number;
  temperature?: number;
  target_temp_step?: number;
  min_temp?: number;
  max_temp?: number;
  hvac_modes?: string[];
  hvac_action?: string;
  fan_modes?: string[];
  fan_mode?: string;
  [key: string]: any;
}

export interface HassEntity {
  entity_id: string;
  state: string; // 'on' | 'off' | 'unavailable' | 'cool' | 'heat' | 'dry' | 'fan_only' | etc.
  attributes: HassEntityAttributes;
  last_changed?: string;
  last_updated?: string;
}

export type HassEntities = Record<string, HassEntity>;

export interface QuickScene {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface RoomSyncConfig {
  enabled: boolean;
  targetEntityIds: string[];
}
