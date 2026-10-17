/* Skaap se Praat – eie ikone (werk sonder internet) */
'use strict';

const IKONE = {
  'home': 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6',
  'list': 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  'calendar': 'M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M4 11h16',
  'cloud-check': 'M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18zM9.5 13.5l2 2 3.5-3.5',
  'cloud-upload': 'M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18zM12 16v-5M9.5 13l2.5-2.5 2.5 2.5',
  'cloud-off': 'M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18zM3 3l18 18',
  'refresh': 'M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4',
  'search': 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM21 21l-6-6',
  'arrow-left': 'M5 12h14M5 12l6-6M5 12l6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'check': 'M5 12l5 5L20 7',
  'baby-carriage': 'M8 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM17 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 4h2.5l1.5 10h12l1-6H7',
  'vaccine': 'M17 3l4 4M19 5l-4 4M14 6l4 4-8.5 8.5H5.5v-4zM5.5 18.5L3 21M10 10l2 2',
  'first-aid-kit': 'M5 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zM9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M12 11v6M9 14h6',
  'scale': 'M6 20h12M12 4v16M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z',
  'notes': 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6M9 16h4',
  'square-plus': 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM12 8v8M8 12h8',
  'cash': 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM6 9v.01M18 15v.01',
  'clipboard-list': 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM9 12h.01M13 12h2M9 16h.01M13 16h2',
  'plus': 'M12 5v14M5 12h14',
  'message': 'M4 20l1.5-4A8 8 0 1 1 8 18.5zM9 11h.01M12 11h.01M15 11h.01',
  'bell': 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4',
  'square': 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
  'square-check': 'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8.5 12l2.5 2.5 4.5-5',
  'book': 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7M8 11h5',
  'gift': 'M4 9h16v4H4zM6 13v8h12v-8M12 9v12M12 9C10 5 7 5 7 7.5S12 9 12 9zM12 9c2-4 5-4 5-1.5S12 9 12 9',
  'heart-broken': 'M19.5 12.6L12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6zM12 6l-2 4 4 3-2 4',
  'sun': 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4l-1.4 1.4M19.8 4.2l-1.4 1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  'pencil': 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  'users': 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M16 4.5a3.5 3.5 0 0 1 0 6.5M21 20v-1a5 5 0 0 0-3.5-4.8',
  'scissors': 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.1 7.9L20 20M8.1 16.1L20 4',
  'package': 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5',
  'truck': 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  'x': 'M18 6L6 18M6 6l12 12',
  'flag': 'M5 21V4M5 4h11l-2 4 2 4H5',
  'heart': 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  'info-circle': 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 8h.01M11 12h1v4h1',
  'alert-triangle': 'M12 4l9 16H3zM12 10v4M12 17h.01',
  'wifi': 'M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M2 8.5a15 15 0 0 1 20 0',
  'wifi-off': 'M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01M2 8.5a15 15 0 0 1 20 0M3 3l18 18',
  'arrows-exchange': 'M7 9h13l-4-4M17 15H4l4 4',
  'arrow-big-up-lines': 'M12 4l6 7h-4v5h-4v-5H6zM10 20h4',
  'door-exit': 'M14 4H5v16h9M10 12h11M18 9l3 3-3 3',
  'shield-check': 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  'flask': 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9',
};

function ikoneVervang(html) {
  return html.replace(/<i class="ti ti-([a-z0-9-]+)"([^>]*)><\/i>/g, function (_, naam, rest) {
    const d = IKONE[naam] || IKONE['info-circle'];
    return '<svg class="ti"' + rest + ' viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + d + '"/></svg>';
  });
}
