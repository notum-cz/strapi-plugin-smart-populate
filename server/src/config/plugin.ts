import type { Core } from '@strapi/strapi';

import { PLUGIN_ID } from '../pluginId';
import type { PluginConfig, PopulateOverrideEntry } from '../types';

export const DEFAULT_ACTIONS = ['findMany', 'findOne', 'findFirst'];

const getConfigValue = <T>(strapi: Core.Strapi, key: keyof PluginConfig, defaultValue: T) => {
  const value = strapi.config.get(`plugin.${PLUGIN_ID}.${key}`);

  return value === undefined ? defaultValue : (value as T);
};

export const getPluginConfig = (strapi: Core.Strapi): PluginConfig => ({
  actions: getConfigValue(strapi, 'actions', DEFAULT_ACTIONS),
  populateOverrides: getConfigValue<PopulateOverrideEntry[]>(strapi, 'populateOverrides', []),
  logGeneratedSchema: getConfigValue(strapi, 'logGeneratedSchema', false),
});

export const validatePluginConfig = (config: Partial<PluginConfig>) => {
  if (config.actions !== undefined && !Array.isArray(config.actions)) {
    throw new Error('actions must be an array of Documents API action names.');
  }

  if (config.populateOverrides !== undefined && !Array.isArray(config.populateOverrides)) {
    throw new Error('populateOverrides must be an array.');
  }

  if (config.logGeneratedSchema !== undefined && typeof config.logGeneratedSchema !== 'boolean') {
    throw new Error('logGeneratedSchema must be a boolean.');
  }
};
