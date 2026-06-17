import type { Core } from '@strapi/strapi';

import { getPluginConfig } from '../config/plugin';
import { mergeDeep } from '../utils/object';

let cachedSchema: Record<string, unknown> | null = null;

export const clearDynamicZonePopulateConfigCache = () => {
  cachedSchema = null;
};

export const getDynamicZonePopulateConfig = ({ strapi }: { strapi: Core.Strapi }) => {
  if (cachedSchema) {
    return cachedSchema;
  }

  cachedSchema = getDynamicZonePopulateSchema({ strapi });

  if (getPluginConfig(strapi).logGeneratedSchema) {
    strapi.log.debug('[strapi-plugin-smart-populate] Generated dynamic zone populate configuration.');
  }

  return cachedSchema;
};

const getDynamicZonePopulateOverridesSchema = (strapi: Core.Strapi) => {
  return Object.fromEntries(
    getPluginConfig(strapi).populateOverrides.map(
      ({ componentUid, mergeWithGeneratedPopulate, overridePopulate }) => [
        componentUid,
        {
          mergeWithGeneratedPopulate,
          populate: overridePopulate,
        },
      ]
    )
  );
};

const getDynamicZonePopulateSchema = ({ strapi }: { strapi: Core.Strapi }) => {
  const components = strapi.components as Record<string, any>;
  const overrides = getDynamicZonePopulateOverridesSchema(strapi);
  const componentCache = new Map<string, any>();

  const buildComponentPopulate = (componentUid: string) => {
    if (componentCache.has(componentUid)) {
      return componentCache.get(componentUid);
    }

    const override = overrides[componentUid];
    const overrideConfig = override ? { populate: override.populate } : null;

    if (override && !override.mergeWithGeneratedPopulate) {
      componentCache.set(componentUid, overrideConfig);

      return overrideConfig;
    }

    const attributes = components[componentUid]?.attributes ?? {};

    componentCache.set(componentUid, true);

    const populate = Object.entries(attributes).reduce<Record<string, unknown>>(
      (acc, [attributeName, attribute]: [string, any]) => {
        if (attribute?.type === 'component') {
          acc[attributeName] = attribute.component
            ? buildComponentPopulate(attribute.component)
            : true;
        }

        if (attribute?.type === 'media' || attribute?.type === 'relation') {
          acc[attributeName] = true;
        }

        return acc;
      },
      {}
    );

    const componentPopulate = Object.keys(populate).length > 0 ? { populate } : true;

    const finalComponentPopulate = override?.mergeWithGeneratedPopulate
      ? mergeDeep(componentPopulate, overrideConfig)
      : componentPopulate;

    componentCache.set(componentUid, finalComponentPopulate);

    return finalComponentPopulate;
  };

  return Object.fromEntries(
    [...new Set([...Object.keys(components), ...Object.keys(overrides)])].map((componentUid) => [
      componentUid,
      buildComponentPopulate(componentUid),
    ])
  );
};
