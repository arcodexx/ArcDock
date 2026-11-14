import { Laptop, Smartphone, Speaker, Car } from 'lucide-vue-next';
import type { Component } from 'vue';

/**
 * Return appropriate Lucide icon component based on Spotify device type
 */
export function getDeviceIcon(type?: string): Component {
  switch (type?.toLowerCase()) {
    case 'smartphone':
      return Smartphone;
    case 'speaker':
    case 'castaudio':
      return Speaker;
    case 'automobile':
      return Car;
    default:
      return Laptop;
  }
}
