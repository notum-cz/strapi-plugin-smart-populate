import type { Core } from '@strapi/strapi';

import { getPluginConfig } from '../config/plugin';
import { createSmartPopulateObject, getSmartPopulatePathsForContext } from './utils';
import { mergeDeep } from '../utils/object';

export const registerPopulateMiddleware = ({ strapi }: { strapi: Core.Strapi }) => {
  strapi.documents.use(async (context, next) => {
    const smartPopulatePaths = getSmartPopulatePathsForContext(strapi, context);
    const actions = new Set(getPluginConfig(strapi).actions);

    if (!actions.has(context.action) || smartPopulatePaths.length === 0) {
      return next();
    }

    const smartPopulateObject = await createSmartPopulateObject(
      strapi,
      context,
      smartPopulatePaths
    );
    const params = ((context as any).params ??= {});

    params.populate = mergeDeep(params.populate, smartPopulateObject);

    return next();
  });
};
