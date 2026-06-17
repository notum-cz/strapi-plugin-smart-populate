import { useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@strapi/design-system';
import { useFetchClient } from '@strapi/strapi/admin';
import { createPortal } from 'react-dom';
import { Outlet, useLocation } from 'react-router-dom';

type OverrideMetadata = {
  componentUid: string;
  mergeWithGeneratedPopulate: boolean;
};

type OverridesResponse = {
  data: OverrideMetadata[];
};

const getComponentUid = (pathname: string) => {
  const match = pathname.match(/content-type-builder\/component-categories\/([^/]+)\/([^/]+)/);

  if (!match) {
    return null;
  }

  const [, categoryUid, componentUid] = match;
  const decodedCategoryUid = decodeURIComponent(categoryUid);
  const decodedComponentUid = decodeURIComponent(componentUid);

  return decodedComponentUid.includes('.')
    ? decodedComponentUid
    : `${decodedCategoryUid}.${decodedComponentUid}`;
};

const ContentTypeBuilderBanner = () => {
  const { get } = useFetchClient();
  const { pathname } = useLocation();
  const componentUid = getComponentUid(pathname);
  const [overrides, setOverrides] = useState<OverrideMetadata[]>([]);
  const [bannerRoot, setBannerRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    get<OverridesResponse>('/smart-populate/overrides')
      .then(({ data }) => setOverrides(data.data))
      .catch(() => setOverrides([]));
  }, [get]);

  const override = useMemo(
    () => overrides.find((entry) => entry.componentUid === componentUid),
    [componentUid, overrides]
  );

  useEffect(() => {
    if (!override) {
      setBannerRoot(null);

      return;
    }

    let root: HTMLDivElement | null = null;

    const attachBannerRoot = () => {
      const header = document.querySelector<HTMLElement>('[data-strapi-header]');

      if (!header || root) {
        return false;
      }

      root = document.createElement('div');
      root.dataset.contentTypeBuilderBanner = 'true';
      header.prepend(root);
      setBannerRoot(root);

      return true;
    };

    if (attachBannerRoot()) {
      return () => root?.remove();
    }

    const observer = new MutationObserver(() => {
      if (attachBannerRoot()) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      root?.remove();
    };
  }, [override]);

  const color = override?.mergeWithGeneratedPopulate ? 'warning600' : 'danger600';

  return (
    <>
      {override && bannerRoot
        ? createPortal(
            <Box
              hasRadius
              marginBottom={8}
              paddingBottom={6}
              paddingLeft={6}
              paddingRight={6}
              paddingTop={6}
              borderColor={color}
              borderWidth="1px"
              borderStyle="solid"
            >
              <Typography variant="beta" fontSize="22px" textColor={color}>
                Smart populate detected!
              </Typography>
              <br />
              <br />
              <Typography variant="epsilon" fontSize="18px" textColor={color}>
                {override.mergeWithGeneratedPopulate
                  ? 'Populate for this component is generated automatically and merged with a manual override. Schema changes should still be picked up automatically. '
                  : 'Populate for this component is fully controlled by the manual override.'}
                <br />
                {override.mergeWithGeneratedPopulate
                  ? 'If something is missing, check the'
                  : 'Whenever the schema changes, update the'}{' '}
                <Typography variant="epsilon" fontWeight="bold">
                  <code>{componentUid}</code>
                </Typography>{' '}
                in{' '}
                <Typography variant="epsilon" fontWeight="bold">
                  <code>config/plugins.ts</code>
                </Typography>{' '}
                and adjust{' '}
                <Typography variant="epsilon" fontWeight="bold">
                  <code>smart-populate.config.populateOverrides</code>
                </Typography>
                .
              </Typography>
            </Box>,
            bannerRoot
          )
        : null}
      <Outlet />
    </>
  );
};

export { ContentTypeBuilderBanner };
