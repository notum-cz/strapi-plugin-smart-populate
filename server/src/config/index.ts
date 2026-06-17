import { DEFAULT_ACTIONS, validatePluginConfig } from './plugin';

export default {
  default: {
    actions: DEFAULT_ACTIONS,
    populateOverrides: [],
    logGeneratedSchema: false,
  },
  validator(config) {
    validatePluginConfig(config);
  },
};
