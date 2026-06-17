import type { Core } from '@strapi/strapi';

import { getDynamicZonePopulateConfig } from './populate';
import { registerPopulateMiddleware } from './populate/middleware';

const bootstrap = ({ strapi }: { strapi: Core.Strapi }) => {
  getDynamicZonePopulateConfig({ strapi });
  registerPopulateMiddleware({ strapi });
};

export default bootstrap;
