import type { Core } from '@strapi/strapi';

import { getSmartPopulatePaths, replaceSmartPopulateParams } from '../populate/utils';

export default (_config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    if (ctx.method === 'GET' && ctx.request?.url?.startsWith('/api/') && ctx.query?.populate) {
      const smartPopulatePaths = getSmartPopulatePaths(ctx.query.populate);

      if (smartPopulatePaths.length > 0) {
        ctx.state.smartPopulatePaths = smartPopulatePaths;
        ctx.query = {
          ...ctx.query,
          populate: replaceSmartPopulateParams(ctx.query.populate),
        };
      }
    }

    return next();
  };
};
