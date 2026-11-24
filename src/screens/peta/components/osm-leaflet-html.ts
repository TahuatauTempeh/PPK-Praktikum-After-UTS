/**
 * osm-leaflet-html.ts: pembangun dokumen HTML Leaflet + OpenStreetMap bersama
 * untuk WebView (Android/iOS) dan iframe (Web), tanpa memerlukan API key Google Maps.
 */

import type { DevicePosition } from '@/lib/device-location';

import type { LaboratoryMapItem, MapRegion } from '../selectors';

export interface OsmLabMarker {
  id: string;
  name: string;
  code: string;
  locationLabel: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isOpen: boolean;
  statusText: string;
}

export interface OsmThemeColors {
  primary: string;
  success: string;
  surface: string;
  text: string;
  accent: string;
}

export interface OsmMapStatePayload {
  labs: OsmLabMarker[];
  selectedLabId: string | null;
  userPosition: DevicePosition | null;
  colors: OsmThemeColors;
}

export type OsmMapInboundMessage =
  | { type: 'ready' }
  | { type: 'error' }
  | { type: 'selectLab'; labId: string | null };

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function toOsmLabMarkers(items: readonly LaboratoryMapItem[]): OsmLabMarker[] {
  return items.map((item) => ({
    id: item.lab.id,
    name: item.lab.name,
    code: item.lab.code,
    locationLabel: item.locationLabel,
    latitude: item.lab.latitude,
    longitude: item.lab.longitude,
    radiusMeters: item.lab.radiusMeters,
    isOpen: item.current?.status === 'open',
    statusText: item.current
      ? `${item.current.title} (${item.current.statusLabel})`
      : item.next
        ? `Berikutnya: ${item.next.title}`
        : 'Belum ada praktikum terjadwal',
  }));
}

export function parseOsmMessage(rawData: unknown): OsmMapInboundMessage | null {
  let parsed: unknown = rawData;
  if (typeof rawData === 'string') {
    try {
      parsed = JSON.parse(rawData);
    } catch {
      return null;
    }
  }
  if (typeof parsed !== 'object' || parsed === null || !('type' in parsed)) {
    return null;
  }
  const msg = parsed as { type?: unknown; labId?: unknown };
  if (msg.type === 'ready') return { type: 'ready' };
  if (msg.type === 'error') return { type: 'error' };
  if (msg.type === 'selectLab') {
    return {
      type: 'selectLab',
      labId: typeof msg.labId === 'string' ? msg.labId : null,
    };
  }
  return null;
}

export function buildOsmLeafletHtml(
  initialRegion: MapRegion,
  initialState: OsmMapStatePayload
): string {
  const regionJson = safeJson(initialRegion);
  const stateJson = safeJson(initialState);

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha384-sHL9NAb7lN7rfvG5lfHpm643Xkcjzp4jFvuavGOndn6pjVqS6ny56CAt3nsEVT4H" crossorigin="anonymous" />
  <style>
    html, body, #map {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #E8EFF9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .lab-pin-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -100%);
      pointer-events: auto;
    }
    .lab-pin-badge {
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: #ffffff;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
      border: 2px solid #ffffff;
    }
    .lab-pin-stem {
      width: 3px;
      height: 8px;
      border-radius: 2px;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    }
    .leaflet-tooltip {
      font-weight: 600;
      border-radius: 8px;
      padding: 4px 8px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script
    src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha384-cxOPjt7s7Iz04uaHJceBmS+qpjv2JkIHNVcuOrM+YHwZOmJGBXI00mdUXEq65HTH"
    crossorigin="anonymous"
    onerror="window.__notifyOsmError && window.__notifyOsmError()"
  ></script>
  <script>
    (function () {
      function postToHost(msg) {
        var text = JSON.stringify(msg);
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(text);
        } else if (window.parent && window.parent !== window) {
          window.parent.postMessage(text, '*');
        }
      }

      window.__notifyOsmError = function () {
        postToHost({ type: 'error' });
      };

      if (typeof L === 'undefined') {
        postToHost({ type: 'error' });
        return;
      }

      var initialRegion = ${regionJson};
      var currentState = ${stateJson};
      // Kosongkan agar applyState pertama memusatkan peta ke lab yang sudah dipilih.
      var lastSelectedId = null;

      var map = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([initialRegion.latitude, initialRegion.longitude], 17);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var labsLayer = L.layerGroup().addTo(map);
      var userLayer = L.layerGroup().addTo(map);

      map.on('click', function () {
        postToHost({ type: 'selectLab', labId: null });
      });

      function createLabIcon(lab, isSelected, colors) {
        var bg = isSelected || lab.isOpen ? colors.success : colors.primary;
        var wrap = document.createElement('div');
        wrap.className = 'lab-pin-wrap';

        var badge = document.createElement('div');
        badge.className = 'lab-pin-badge';
        badge.style.backgroundColor = bg;
        badge.style.transform = isSelected ? 'scale(1.08)' : 'scale(1)';
        badge.textContent = lab.code || lab.name;

        var stem = document.createElement('div');
        stem.className = 'lab-pin-stem';

        wrap.appendChild(badge);
        wrap.appendChild(stem);

        return L.divIcon({
          className: '',
          html: wrap.outerHTML,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
      }

      function applyState(nextState) {
        if (!nextState) return;
        currentState = nextState;
        var colors = nextState.colors;
        var labs = nextState.labs || [];
        var selectedId = nextState.selectedLabId || null;

        labsLayer.clearLayers();

        for (var i = 0; i < labs.length; i++) {
          (function (lab) {
            var isSelected = lab.id === selectedId;
            if (isSelected && lab.radiusMeters > 0) {
              L.circle([lab.latitude, lab.longitude], {
                radius: lab.radiusMeters,
                color: colors.accent,
                fillColor: colors.accent,
                fillOpacity: 0.14,
                weight: 2
              }).addTo(labsLayer);
            }

            var marker = L.marker([lab.latitude, lab.longitude], {
              icon: createLabIcon(lab, isSelected, colors),
              title: lab.name
            });

            var tooltipEl = document.createElement('span');
            tooltipEl.textContent = lab.name + ' · ' + lab.statusText;
            marker.bindTooltip(tooltipEl, { direction: 'top', offset: [0, -32] });

            marker.on('click', function (ev) {
              L.DomEvent.stopPropagation(ev);
              postToHost({ type: 'selectLab', labId: lab.id });
            });

            marker.addTo(labsLayer);

            if (isSelected && selectedId !== lastSelectedId) {
              map.flyTo([lab.latitude, lab.longitude], Math.max(map.getZoom(), 17), {
                duration: 0.4
              });
            }
          })(labs[i]);
        }

        lastSelectedId = selectedId;

        userLayer.clearLayers();
        var userPos = nextState.userPosition;
        if (userPos && typeof userPos.latitude === 'number' && typeof userPos.longitude === 'number') {
          var acc = Math.max(10, Math.min(userPos.accuracyMeters || 25, 200));
          L.circle([userPos.latitude, userPos.longitude], {
            radius: acc,
            color: colors.accent,
            fillColor: colors.accent,
            fillOpacity: 0.14,
            weight: 1
          }).addTo(userLayer);

          var userDot = L.circleMarker([userPos.latitude, userPos.longitude], {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: colors.primary,
            fillOpacity: 1
          });
          userDot.bindTooltip('Posisi kamu', { direction: 'top' });
          userDot.addTo(userLayer);
        }
      }

      function centerTo(lat, lng, zoom) {
        if (typeof lat !== 'number' || typeof lng !== 'number') return;
        map.flyTo([lat, lng], zoom || 17, { duration: 0.4 });
      }

      window.__OSM_MAP__ = {
        updateState: applyState,
        centerTo: centerTo
      };

      window.addEventListener('message', function (event) {
        var data = event.data;
        if (typeof data === 'string') {
          try { data = JSON.parse(data); } catch { return; }
        }
        if (!data || typeof data !== 'object') return;
        if (data.type === 'updateState') {
          applyState(data.payload);
        } else if (data.type === 'centerTo' && data.payload) {
          centerTo(data.payload.latitude, data.payload.longitude, data.payload.zoom);
        }
      });

      applyState(currentState);
      postToHost({ type: 'ready' });
    })();
  </script>
</body>
</html>`;
}
