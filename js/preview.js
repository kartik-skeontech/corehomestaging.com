/**
 * Hygraph Preview SDK Loader — Click-to-Edit + Live Content Sync
 *
 * Conditionally loads the Hygraph Preview SDK when the page is opened
 * in preview mode (?preview=true or inside an iframe). The SDK:
 *
 * 1. Scans for data-hygraph-entry-id / data-hygraph-field-api-id attributes
 *    and shows edit overlays that deep-link to Hygraph Studio.
 * 2. Auto-updates DOM text as the editor types (ContentUpdater).
 * 3. Fires a "save" event when the editor clicks Save — we re-fetch and
 *    re-hydrate the full page to pick up relational/computed changes.
 *
 * Zero overhead for normal visitors — the SDK script is never fetched
 * unless preview mode is detected.
 */
(function () {
  'use strict';

  var isPreview = window.location.search.indexOf('preview=true') !== -1 ||
                  window.self !== window.top;
  if (!isPreview) return;

  var script = document.createElement('script');
  script.src = 'https://unpkg.com/@hygraph/preview-sdk@1.0.3/dist/index.umd.js';
  script.onload = function () {
    if (!window.HygraphPreviewSDK || !window.HygraphPreviewSDK.Preview) return;

    var preview = new window.HygraphPreviewSDK.Preview({
      endpoint: CMS_CONFIG.endpoint,
      debug: false,
      sync: { fieldUpdate: true }
    });

    // When the editor saves, re-fetch all content and re-hydrate the page
    preview.subscribe('save', {
      callback: function () {
        if (window._cmsRehydrate) window._cmsRehydrate();
      }
    });
  };
  document.head.appendChild(script);
})();
