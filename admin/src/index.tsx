import { ContentTypeBuilderBanner } from './extensions/ContentTypeBuilderBanner';

import type { StrapiApp } from '@strapi/strapi/admin';
import type { RouteObject } from 'react-router-dom';

const wrapContentTypeBuilderRoute = (route: RouteObject): RouteObject => {
  if (route.index || route.path !== 'plugins/content-type-builder/*') {
    return route;
  }

  return {
    ...route,
    element: <ContentTypeBuilderBanner />,
    children: [
      {
        path: '*',
        lazy: route.lazy,
        element: route.element,
        children: route.children,
      },
    ],
    lazy: undefined,
  };
};

const plugin: StrapiApp['appPlugins'][string] = {
  register(app) {
    app.router.addRoute((routes) => routes.map(wrapContentTypeBuilderRoute));

    app.registerPlugin({
      id: 'strapi-plugin-smart-populate',
      isReady: true,
      name: 'strapi-plugin-smart-populate',
    });
  },
};

export default plugin;
