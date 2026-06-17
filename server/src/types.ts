export type PopulateOverrideEntry = {
  componentUid: string;
  mergeWithGeneratedPopulate?: boolean;
  overridePopulate: unknown;
};

export type PluginConfig = {
  actions: string[];
  populateOverrides: PopulateOverrideEntry[];
  logGeneratedSchema: boolean;
};
