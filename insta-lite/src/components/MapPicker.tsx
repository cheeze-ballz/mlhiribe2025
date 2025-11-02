"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Inner = dynamic(async () => {
  const L = await import("leaflet");
  const RL = await import("react-leaflet");
  const { MapContainer, TileLayer, Marker, useMapEvents } = RL;

  // fix default marker icons in Next/webpack
  // @ts-ignore
  delete (L.Icon.Default as any).prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });

  function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
      click(e) { onPick(e.latlng.lat, e.latlng.lng); },
    });
    return null;
  }

  return function Comp({
    value,
    onChange,
    height = 260,
    zoom = 15,
  }: {
    value?: { lat: number; lng: number };
    onChange: (v: { lat: number; lng: number }) => void;
    height?: number; zoom?: number;
  }) {
    const [center, setCenter] = useState<{ lat: number; lng: number }>(value ?? { lat: 38.9897, lng: -76.9378 });
    const [marker, setMarker] = useState<{ lat: number; lng: number }>(value ?? center);

    useEffect(() => {
      if (!value && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCenter(c); setMarker(c); onChange(c);
        });
      }
    }, [value, onChange]);

    return (
      <MapContainer center={center} zoom={zoom} style={{ height, width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <Marker
          position={marker}
          draggable
          eventHandlers={{
            dragend: (e: any) => {
              const m = e.target.getLatLng();
              const v = { lat: m.lat, lng: m.lng };
              setMarker(v); onChange(v);
            },
          }}
        />
        <ClickHandler onPick={(lat, lng) => { const v = { lat, lng }; setMarker(v); onChange(v); }} />
      </MapContainer>
    );
  };
}, { ssr: false });

export default function MapPicker(props: React.ComponentProps<typeof Inner>) {
  return <Inner {...props} />;
}
