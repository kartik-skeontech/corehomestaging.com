/**
 * Hygraph CMS Configuration
 *
 * After setting up your Hygraph project, replace the endpoint below
 * with your project's Content API endpoint (public, read-only).
 *
 * Find it in: Hygraph Dashboard > Project Settings > API Access > Content API
 */
var CMS_CONFIG = {
  endpoint: 'https://us-west-2.cdn.hygraph.com/content/cmlnbszzu03lj07w926r5z5fl/master',

  // Permanent Auth Token with DRAFT stage access (for preview mode).
  // Create in: Hygraph > Project Settings > Access > Permanent Auth Tokens
  // Set default stage to DRAFT and grant read permissions.
  previewToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImdjbXMtbWFpbi1wcm9kdWN0aW9uIn0.eyJ2ZXJzaW9uIjozLCJpYXQiOjE3NzI0ODIzMDAsImF1ZCI6WyJodHRwczovL2FwaS11cy13ZXN0LTIuaHlncmFwaC5jb20vdjIvY21sbmJzenp1MDNsajA3dzkyNnI1ejVmbC9tYXN0ZXIiLCJtYW5hZ2VtZW50LW5leHQuZ3JhcGhjbXMuY29tIl0sImlzcyI6Imh0dHBzOi8vbWFuYWdlbWVudC11cy13ZXN0LTIuaHlncmFwaC5jb20vIiwic3ViIjoiYjMyMTYzNTQtZDVmYS00Mjk0LTlkMmUtMzI3YmU1ODA1YWU5IiwianRpIjoiY21tOW03M3R3MGgzMDA3bjYzdnoyY2l3ZCJ9.NE3zcf1GYkNZ72hyn7pgr3E5Sfc6KVoYQM4eQKTD0ClO3wVkULwQuCgybEfnh_gdF2oAzSRqIFYflX1HACdeEuadkFcJvBb5nxK-Zu-wh49gxDaWgwgksTfkUPy3BrrPqzWZumpWYu2H81ZCwnXPWZ45QsSNaUvU0zbUCf_akSbiapbuaRtMBksdF4s3PXrSxvaYqV0AqSopsKEjgyBltI1maADiQ_wPRMRC89O2XFx5QfnoDHJ7BovDxPHFrJ-jha4lP-eXxu_5LE3QOURRcL5pOmE-PCIHdUsPRxTj80BpMtzp1GPla-rROIbQAQ7MKbayiWxqSVwOYN2SUS2xdXpISzUYdsO2RijfDIzik_FLc92Mo54hnDlOWc-I_3ex3S2cGkXLU7g3sOtvjFNupXKZb6AYKai4oPwxmPvjsDYbO56UReGpY27J6KLhAqAg10uHrRLCj-S1d0LvDh0zUPSrAa9lRmo5iKkShClJxh4hioVi1ORMzYNaxhfx5z8C1aA_oYm3rAauKo34fMf3fDKzP2bnRPAiG3_fiCrF-5g0sKQj56SqcZo-A68Cwh_JjWi-huvgHX25lyocxfjpHB9cDEJYJejNUC3M4Sr2ungg5b2qBfL_GTwZaeOfiHFUKsvilCVtvv0U8HqBqKGeQSkEeSC1WGIZVD_aiLonAUU',

  // Set to true once you've populated content in Hygraph
  enabled: true
};
