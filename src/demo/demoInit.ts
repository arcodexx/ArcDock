/**
 * ArcDock Demo Early Initialization Realm
 * 
 * Sets the demo flag and installs the in-memory storage sandbox & mock fetch interceptor
 * BEFORE any Pinia store or Vue component module is imported or evaluated.
 */

(window as any).__ARCDOCK_IS_DEMO__ = true;

import './demoStorage';
import { installDemoMockEngine } from './mockData';

// Install the mock engine immediately
installDemoMockEngine();
