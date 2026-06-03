import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import * as Notifications from "expo-notifications";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const FAKE_LOCATION = { latitude: 10.0159, longitude: 76.3419 };

function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function sendNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });
}

type Mode = "idle" | "placing" | "active";
type Coord = { latitude: number; longitude: number };

function buildMapHTML(
  helmet: Coord,
  center: Coord | null,
  radius: number,
  mode: Mode,
  isInside: boolean,
): string {
  const circleColor =
    mode === "placing" ? "#ffaa00" : isInside ? "#00ffff" : "#ff4444";
  const circleData = center
    ? `var geofenceCenter = [${center.latitude}, ${center.longitude}]; var geofenceRadius = ${radius};`
    : `var geofenceCenter = null; var geofenceRadius = ${radius};`;

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; background: #212121; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var helmetPos = [${helmet.latitude}, ${helmet.longitude}];
  ${circleData}
  var circleColor = "${circleColor}";
  var placingMode = ${mode === "placing"};

  var map = L.map('map', { zoomControl: true, attributionControl: false })
    .setView(helmetPos, 15);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);

  var helmetIcon = L.divIcon({
    html: '<div style="display:flex;flex-direction:column;align-items:center"><div style="font-size:28px">🛡️</div><div style="color:#00ffff;font-size:11px;font-weight:bold;white-space:nowrap">Helmet</div></div>',
    iconSize: [50, 45],
    iconAnchor: [25, 45],
    className: ''
  });

  var helmetMarker = L.marker(helmetPos, { icon: helmetIcon }).addTo(map);

  var circle = null;
  var centerMarker = null;

  function updateGeofence() {
    if (circle) { map.removeLayer(circle); circle = null; }
    if (centerMarker) { map.removeLayer(centerMarker); centerMarker = null; }
    if (geofenceCenter) {
      circle = L.circle(geofenceCenter, {
        radius: geofenceRadius,
        color: circleColor,
        weight: 2,
        fillColor: circleColor,
        fillOpacity: 0.08
      }).addTo(map);

      var dotIcon = L.divIcon({
        html: '<div style="width:14px;height:14px;border-radius:50%;background:' + circleColor + ';border:2px solid #000"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        className: ''
      });
      centerMarker = L.marker(geofenceCenter, { icon: dotIcon }).addTo(map);
    }
  }

  updateGeofence();

  if (placingMode) {
    map.on('click', function(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: e.latlng.lat,
        lng: e.latlng.lng
      }));
    });
  }

  window.updateHelmet = function(lat, lng) {
    helmetPos = [lat, lng];
    helmetMarker.setLatLng(helmetPos);
  };

  window.updateCircle = function(lat, lng, r, color) {
    geofenceCenter = lat !== null ? [lat, lng] : null;
    geofenceRadius = r;
    circleColor = color;
    updateGeofence();
  };

  window.recenter = function() {
    map.setView(helmetPos, 15);
  };
</script>
</body>
</html>`;
}

const LeafletMap = memo(
  ({
    helmetLocation,
    geofenceCenter,
    geofenceRadius,
    geofenceColor,
    mode,
    isInsideGeofence,
    onMapPress,
    onRecenter,
  }: {
    helmetLocation: Coord;
    geofenceCenter: Coord | null;
    geofenceRadius: number;
    geofenceColor: string;
    mode: Mode;
    isInsideGeofence: boolean;
    onMapPress: (lat: number, lng: number) => void;
    onRecenter: () => void;
  }) => {
    const webViewRef = useRef<WebView>(null);
    const [html, setHtml] = useState(() =>
      buildMapHTML(
        helmetLocation,
        geofenceCenter,
        geofenceRadius,
        mode,
        isInsideGeofence,
      ),
    );
    const prevMode = useRef(mode);

    // Rebuild HTML when mode changes (to enable/disable map click)
    useEffect(() => {
      if (prevMode.current !== mode) {
        prevMode.current = mode;
        setHtml(
          buildMapHTML(
            helmetLocation,
            geofenceCenter,
            geofenceRadius,
            mode,
            isInsideGeofence,
          ),
        );
      }
    }, [mode]);

    // Update helmet marker via JS injection
    useEffect(() => {
      webViewRef.current?.injectJavaScript(
        `window.updateHelmet && window.updateHelmet(${helmetLocation.latitude}, ${helmetLocation.longitude}); true;`,
      );
    }, [helmetLocation]);

    // Update circle via JS injection
    useEffect(() => {
      const lat = geofenceCenter ? geofenceCenter.latitude : null;
      const lng = geofenceCenter ? geofenceCenter.longitude : null;
      webViewRef.current?.injectJavaScript(
        `window.updateCircle && window.updateCircle(${lat}, ${lng}, ${geofenceRadius}, "${geofenceColor}"); true;`,
      );
    }, [geofenceCenter, geofenceRadius, geofenceColor]);

    const handleMessage = useCallback(
      (event: any) => {
        try {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === "mapPress") {
            onMapPress(data.lat, data.lng);
          }
        } catch {}
      },
      [onMapPress],
    );

    const handleRecenter = useCallback(() => {
      webViewRef.current?.injectJavaScript(
        `window.recenter && window.recenter(); true;`,
      );
      onRecenter();
    }, [onRecenter]);

    return (
      <View style={styles.mapWrapper}>
        <WebView
          ref={webViewRef}
          source={{ html }}
          style={styles.map}
          onMessage={handleMessage}
          javaScriptEnabled
          scrollEnabled={false}
        />

        <View style={[styles.badge, { left: 12 }]}>
          <View style={styles.orangeDot} />
          <Text style={styles.badgeText}>DEMO MODE</Text>
        </View>

        {mode === "placing" && (
          <View style={[styles.badge, { right: 12, borderColor: "#ffaa00" }]}>
            <Ionicons name="finger-print" size={12} color="#ffaa00" />
            <Text style={[styles.badgeText, { color: "#ffaa00" }]}>
              {geofenceCenter ? "DRAG SLIDER" : "TAP TO PLACE"}
            </Text>
          </View>
        )}
        {mode === "active" && (
          <View
            style={[styles.badge, { right: 12, borderColor: geofenceColor }]}
          >
            <Ionicons
              name={isInsideGeofence ? "checkmark-circle" : "warning"}
              size={12}
              color={geofenceColor}
            />
            <Text style={[styles.badgeText, { color: geofenceColor }]}>
              {isInsideGeofence ? "IN ZONE" : "OUT OF ZONE"}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.fab}
          onPress={handleRecenter}
          activeOpacity={0.85}
        >
          <Ionicons name="locate" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  },
);

const IdlePanel = memo(({ onStart }: { onStart: () => void }) => (
  <View style={styles.panel}>
    <TouchableOpacity
      style={styles.setBtn}
      onPress={onStart}
      activeOpacity={0.85}
    >
      <Ionicons name="radio-button-on" size={18} color="#000" />
      <Text style={styles.setBtnText}>Set Geofence</Text>
    </TouchableOpacity>
  </View>
));

const PlacingPanel = memo(
  ({
    geofenceCenter,
    geofenceRadius,
    onRadiusChange,
    onConfirm,
    onCancel,
  }: {
    geofenceCenter: Coord | null;
    geofenceRadius: number;
    onRadiusChange: (v: number) => void;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <View style={styles.panel}>
      {!geofenceCenter ? (
        <View style={styles.tapHint}>
          <Ionicons name="hand-left" size={22} color="#ffaa00" />
          <Text style={styles.tapHintText}>
            Tap on the map to place the zone center
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.radiusDisplayRow}>
            <Text style={styles.radiusNumber}>{geofenceRadius}</Text>
            <Text style={styles.radiusUnit}>m</Text>
          </View>
          <View style={styles.sliderRow}>
            <Ionicons name="remove-circle" size={22} color="#555" />
            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={1000}
              step={10}
              value={geofenceRadius}
              onValueChange={onRadiusChange}
              minimumTrackTintColor="#ffaa00"
              maximumTrackTintColor="#333"
              thumbTintColor="#ffaa00"
            />
            <Ionicons name="add-circle" size={22} color="#ffaa00" />
          </View>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>10m</Text>
            <Text style={styles.sliderLabel}>1000m</Text>
          </View>
        </>
      )}
      <View style={styles.rowBtns}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={onCancel}
          activeOpacity={0.85}
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, !geofenceCenter && styles.disabledBtn]}
          onPress={onConfirm}
          disabled={!geofenceCenter}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={18} color="#000" />
          <Text style={styles.confirmBtnText}>Confirm Zone</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
);

const ActivePanel = memo(
  ({
    geofenceRadius,
    geofenceColor,
    isSimulating,
    onSimulate,
    onClear,
  }: {
    geofenceRadius: number;
    geofenceColor: string;
    isSimulating: boolean;
    onSimulate: () => void;
    onClear: () => void;
  }) => (
    <View style={styles.panel}>
      <View style={styles.activeControls}>
        <View
          style={[styles.radiusInfo, { borderColor: geofenceColor + "55" }]}
        >
          <Ionicons name="radio-button-on" size={16} color={geofenceColor} />
          <Text style={[styles.radiusText, { color: geofenceColor }]}>
            {geofenceRadius}m safe zone
          </Text>
        </View>
        <TouchableOpacity
          style={styles.simBtn}
          onPress={onSimulate}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isSimulating ? "stop" : "play"}
            size={16}
            color="#fff"
          />
          <Text style={styles.simBtnText}>
            {isSimulating ? "Stop" : "Simulate"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={onClear}
          activeOpacity={0.85}
        >
          <Ionicons name="trash" size={16} color="#fff" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
);

export default function TrackPage() {
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [geofenceCenter, setGeofenceCenter] = useState<Coord | null>(null);
  const [geofenceRadius, setGeofenceRadius] = useState(100);
  const [isInsideGeofence, setIsInsideGeofence] = useState(true);
  const [helmetLocation, setHelmetLocation] = useState<Coord>(FAKE_LOCATION);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    Notifications.requestPermissionsAsync().then((result: any) => {
      if (result.status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Enable notifications for geofence alerts.",
        );
      }
    });
  }, []);

  useEffect(() => {
    if (mode !== "active" || !geofenceCenter) return;
    const dist = getDistanceMeters(
      geofenceCenter.latitude,
      geofenceCenter.longitude,
      helmetLocation.latitude,
      helmetLocation.longitude,
    );
    const inside = dist <= geofenceRadius;
    if (isInsideGeofence && !inside) {
      setIsInsideGeofence(false);
      sendNotification(
        "🚨 Helmet Left Zone!",
        `Helmet is ${Math.round(dist)}m away.`,
      );
    } else if (!isInsideGeofence && inside) {
      setIsInsideGeofence(true);
      sendNotification(
        "✅ Helmet Back in Zone",
        "Your helmet returned to the safe zone.",
      );
    }
  }, [helmetLocation, mode, geofenceCenter, geofenceRadius]);

  useEffect(
    () => () => {
      if (simRef.current) clearInterval(simRef.current);
    },
    [],
  );

  const handleMapPress = useCallback(
    (lat: number, lng: number) => {
      if (mode !== "placing") return;
      setGeofenceCenter({ latitude: lat, longitude: lng });
    },
    [mode],
  );

  const handleRadiusChange = useCallback(
    (val: number) => setGeofenceRadius(Math.round(val)),
    [],
  );

  const handleConfirm = useCallback(() => {
    if (!geofenceCenter) return;
    setMode("active");
    setIsInsideGeofence(true);
    Alert.alert(
      "✅ Geofence Active",
      `Safe zone of ${geofenceRadius}m is now active.`,
    );
  }, [geofenceCenter, geofenceRadius]);

  const handleCancel = useCallback(() => {
    setMode("idle");
    setGeofenceCenter(null);
    setGeofenceRadius(100);
  }, []);

  const handleClear = useCallback(() => {
    setMode("idle");
    setGeofenceCenter(null);
    setGeofenceRadius(100);
    setIsInsideGeofence(true);
    if (simRef.current) {
      clearInterval(simRef.current);
      simRef.current = null;
    }
    setIsSimulating(false);
    setHelmetLocation(FAKE_LOCATION);
  }, []);

  const handleSimulate = useCallback(() => {
    if (isSimulating) {
      clearInterval(simRef.current!);
      simRef.current = null;
      setIsSimulating(false);
      setHelmetLocation(FAKE_LOCATION);
      setIsInsideGeofence(true);
      return;
    }
    setIsSimulating(true);
    let step = 0;
    simRef.current = setInterval(() => {
      step++;
      setHelmetLocation((prev) => ({
        ...prev,
        longitude: prev.longitude + 0.0001,
      }));
      if (step >= 30) {
        clearInterval(simRef.current!);
        simRef.current = null;
        setIsSimulating(false);
      }
    }, 800);
  }, [isSimulating]);

  const geofenceColor =
    mode === "placing" ? "#ffaa00" : isInsideGeofence ? "#00ffff" : "#ff4444";

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Helmet Location</Text>
      <LeafletMap
        helmetLocation={helmetLocation}
        geofenceCenter={geofenceCenter}
        geofenceRadius={geofenceRadius}
        geofenceColor={geofenceColor}
        mode={mode}
        isInsideGeofence={isInsideGeofence}
        onMapPress={handleMapPress}
        onRecenter={() => {}}
      />
      {mode === "idle" && <IdlePanel onStart={() => setMode("placing")} />}
      {mode === "placing" && (
        <PlacingPanel
          geofenceCenter={geofenceCenter}
          geofenceRadius={geofenceRadius}
          onRadiusChange={handleRadiusChange}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      {mode === "active" && (
        <ActivePanel
          geofenceRadius={geofenceRadius}
          geofenceColor={geofenceColor}
          isSimulating={isSimulating}
          onSimulate={handleSimulate}
          onClear={handleClear}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginVertical: 10,
  },
  mapWrapper: { flex: 1 },
  map: { flex: 1, backgroundColor: "#212121" },
  badge: {
    position: "absolute",
    top: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#00ffff",
    gap: 6,
  },
  badgeText: { color: "#00ffff", fontSize: 12, fontWeight: "bold" },
  orangeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffa500",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#00ffff",
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#00ffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  panel: {
    backgroundColor: "#0a0a0a",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    gap: 12,
    paddingBottom: Platform.OS === "ios" ? 60 : 80,
  },
  setBtn: {
    backgroundColor: "#00ffff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  setBtnText: { color: "#000", fontWeight: "bold", fontSize: 15 },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  tapHintText: { color: "#ffaa00", fontSize: 14, fontWeight: "600" },
  radiusDisplayRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 4,
  },
  radiusNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffaa00",
    lineHeight: 54,
  },
  radiusUnit: { fontSize: 18, color: "#888", paddingBottom: 6 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  slider: { flex: 1, height: 40 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -4,
  },
  sliderLabel: { color: "#555", fontSize: 11 },
  rowBtns: { flexDirection: "row", gap: 10 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  cancelBtnText: { color: "#888", fontWeight: "bold" },
  confirmBtn: {
    flex: 2,
    backgroundColor: "#00ffff",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  disabledBtn: { opacity: 0.4 },
  confirmBtnText: { color: "#000", fontWeight: "bold" },
  activeControls: { flexDirection: "row", alignItems: "center", gap: 10 },
  radiusInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  radiusText: { fontWeight: "bold", fontSize: 13 },
  simBtn: {
    backgroundColor: "#333",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  simBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
  clearBtn: {
    backgroundColor: "#cc0000",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clearBtnText: { color: "#fff", fontSize: 13, fontWeight: "bold" },
});
