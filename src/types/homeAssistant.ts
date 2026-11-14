export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'mock' | 'error';

export interface HassEntityAttributes {
  friendly_name?: string;
  brightness?: number; // 0 to 255
  color_temp?: number;
  rgb_color?: [number, number, number];
  icon?: string;
  supported_color_modes?: string[];
  [key: string]: any;
}

export interface HassEntity {
  entity_id: string;
  state: string; // 'on' | 'off' | 'unavailable' | etc.
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
