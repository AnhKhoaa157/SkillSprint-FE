// Root barrel. Namespaced per-domain to avoid name collisions between
// duplicate types that exist across domains (e.g. ServicePlanType,
// CalendarTaskResponse). Import a domain: `import { admin } from '@/api'`.
export * as admin from './admin';
export * as auth from './auth';
export * as core from './core';
export * as learning from './learning';
export * as billing from './billing';
export * as system from './system';
export * as utilities from './utilities';
export * as community from './community';
