/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'colorthief' {
  export default class ColorThief {
    getColor(sourceImage: HTMLImageElement, quality?: number): [number, number, number];
    getPalette(sourceImage: HTMLImageElement, colorCount?: number, quality?: number): [number, number, number][];
  }
}
