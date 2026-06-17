import type { Core, UID } from '@strapi/strapi';

import { getDynamicZonePopulateConfig } from '.';
import { isPlainObject, mergeDeep, setNestedValue, unique } from '../utils/object';

const buildPopulateObject = (paths: string[], getValue: (path: string) => unknown) =>
  paths.reduce<Record<string, unknown>>((populate, path) => {
    const nestedPath = path
      .split('.')
      .flatMap((part, index) => (index === 0 ? [part] : ['populate', part]));

    setNestedValue(populate, nestedPath, getValue(path));

    return populate;
  }, {});

export const getSmartPopulatePaths = (populate: unknown, parentPath: string[] = []): string[] => {
  if (!isPlainObject(populate)) {
    return [];
  }

  return Object.entries(populate).flatMap(([key, value]) => {
    if (value === 'smart') {
      return [[...parentPath, key].join('.')];
    }

    return isPlainObject(value) ? getSmartPopulatePaths(value.populate, [...parentPath, key]) : [];
  });
};

export const replaceSmartPopulateParams = (value: unknown): unknown => {
  if (value === 'smart') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.map(replaceSmartPopulateParams);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      replaceSmartPopulateParams(nestedValue),
    ])
  );
};

const consumeRequestSmartPopulatePaths = (strapi: Core.Strapi) => {
  const requestContext = (strapi as any).requestContext?.get?.();
  const smartPopulatePaths = requestContext?.state?.smartPopulatePaths ?? [];

  if (smartPopulatePaths.length > 0) {
    requestContext.state.smartPopulatePaths = [];
  }

  return smartPopulatePaths;
};

const getContextSmartPopulatePaths = (context: { params?: Record<string, any> }) => {
  const smartPopulatePaths = getSmartPopulatePaths(context.params?.populate);

  if (smartPopulatePaths.length > 0) {
    context.params = context.params ?? {};
    context.params.populate = replaceSmartPopulateParams(context.params.populate);
  }

  return smartPopulatePaths;
};

export const getSmartPopulatePathsForContext = (
  strapi: Core.Strapi,
  context: {
    params?: Record<string, any>;
  }
) => {
  const requestSmartPopulatePaths = consumeRequestSmartPopulatePaths(strapi);

  return requestSmartPopulatePaths.length > 0
    ? requestSmartPopulatePaths
    : getContextSmartPopulatePaths(context);
};

const getComponentUidsAtPath = (entry: unknown, path: string) => {
  const zones = path.split('.').reduce<unknown[]>(
    (values, attributeName) =>
      values.flatMap((value) => {
        if (Array.isArray(value)) {
          return value.flatMap((item) => (isPlainObject(item) ? [item[attributeName]] : []));
        }

        return isPlainObject(value) ? [value[attributeName]] : [];
      }),
    [entry]
  );

  return zones.flatMap((zone) =>
    Array.isArray(zone)
      ? zone.flatMap((block) =>
          isPlainObject(block) && typeof block.__component === 'string' ? [block.__component] : []
        )
      : []
  );
};

const getAttributeAtPath = (
  strapi: Core.Strapi,
  context: {
    contentType: {
      attributes: Record<string, any>;
    };
  },
  path: string
) => {
  let attributes = context.contentType.attributes;
  const pathParts = path.split('.');

  for (const [index, attributeName] of pathParts.entries()) {
    const attribute = attributes?.[attributeName];

    if (!attribute || index === pathParts.length - 1) {
      return attribute;
    }

    if (attribute.type !== 'component' || !attribute.component) {
      return null;
    }

    attributes = (strapi.components as Record<string, any>)[attribute.component]?.attributes ?? {};
  }

  return null;
};

const getComponentPopulatePaths = (
  strapi: Core.Strapi,
  context: {
    contentType: {
      attributes: Record<string, any>;
    };
  },
  smartPopulatePaths: string[]
) =>
  smartPopulatePaths.filter(
    (path) => getAttributeAtPath(strapi, context, path)?.type === 'component'
  );

const getComponentsToPopulate = async (
  strapi: Core.Strapi,
  context: {
    uid: UID.ContentType;
    action: string;
    documentId?: string | number;
    locale?: string;
    params?: Record<string, any>;
  },
  smartPopulatePaths: string[]
) => {
  const documentsApi = strapi.documents(context.uid) as Record<string, any>;
  const action = documentsApi[context.action];

  if (typeof action !== 'function') {
    return Object.fromEntries(smartPopulatePaths.map((path) => [path, []]));
  }

  const prefetchedData = await action.call(documentsApi, {
    ...context.params,
    ...(context.documentId ? { documentId: context.documentId } : {}),
    populate: buildPopulateObject(smartPopulatePaths, () => true),
    fields: ['documentId'],
    locale: context.locale ?? context.params?.locale,
  });

  const entries = Array.isArray(prefetchedData) ? prefetchedData : [prefetchedData];

  return Object.fromEntries(
    smartPopulatePaths.map((path) => [
      path,
      unique(entries.flatMap((entry) => getComponentUidsAtPath(entry, path))),
    ])
  );
};

export const createSmartPopulateObject = async (
  strapi: Core.Strapi,
  context: {
    uid: UID.ContentType;
    action: string;
    documentId?: string | number;
    locale?: string;
    params?: Record<string, any>;
    contentType: {
      attributes: Record<string, any>;
    };
  },
  smartPopulatePaths: string[]
) => {
  const populateConfig = getDynamicZonePopulateConfig({ strapi });

  if (!populateConfig) {
    throw new Error(
      'Populate config not found. Ensure the dynamic zone populate configuration exists.'
    );
  }

  const componentPopulatePaths = getComponentPopulatePaths(strapi, context, smartPopulatePaths);

  const dynamicZonePopulatePaths = smartPopulatePaths.filter(
    (path) => !componentPopulatePaths.includes(path)
  );

  const componentPopulateObject = buildPopulateObject(componentPopulatePaths, (path) => {
    const attribute = getAttributeAtPath(strapi, context, path);
    const componentUid = attribute?.component;

    return componentUid && componentUid in populateConfig ? populateConfig[componentUid] : true;
  });

  if (dynamicZonePopulatePaths.length === 0) {
    return componentPopulateObject;
  }

  const componentsToPopulate = await getComponentsToPopulate(
    strapi,
    context,
    dynamicZonePopulatePaths
  );

  const dynamicZonePopulateObject = buildPopulateObject(dynamicZonePopulatePaths, (path) => ({
    on: Object.fromEntries(
      componentsToPopulate[path]
        .filter((component) => component in populateConfig)
        .map((component) => [component, populateConfig[component]])
    ),
  }));

  return mergeDeep(componentPopulateObject, dynamicZonePopulateObject);
};
