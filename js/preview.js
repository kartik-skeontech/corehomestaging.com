/**
 * Hygraph Click-to-Edit Preview SDK Loader
 *
 * Conditionally loads the Hygraph Preview SDK when the page is opened
 * in preview mode (?preview=true or inside an iframe). The SDK scans
 * for data-hygraph-entry-id / data-hygraph-field-api-id attributes and
 * shows edit overlays that deep-link to Hygraph Studio.
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
    if (!window.HygraphPreviewSDK) return;
  };
  document.head.appendChild(script);
})();
