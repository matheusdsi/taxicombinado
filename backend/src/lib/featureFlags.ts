export interface FeatureFlags {
  showRouteSteps: boolean;
}

const flags: FeatureFlags = {
  showRouteSteps: process.env.SHOW_ROUTE_STEPS !== 'false',
};

export function getFlags(): FeatureFlags {
  return { ...flags };
}

export function setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): void {
  flags[key] = value;
}
