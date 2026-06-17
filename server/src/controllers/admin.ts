import type { Core } from '@strapi/strapi';

import { getPluginConfig } from '../config/plugin';

const adminController = ({ strapi }: { strapi: Core.Strapi }) => ({
  getOverrides(ctx) {
    const { populateOverrides } = getPluginConfig(strapi);

    ctx.body = {
      data: populateOverrides.map(({ componentUid, mergeWithGeneratedPopulate }) => ({
        componentUid,
        mergeWithGeneratedPopulate: Boolean(mergeWithGeneratedPopulate),
      })),
    };
  },
});

export default adminController;
