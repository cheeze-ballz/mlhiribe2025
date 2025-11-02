"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(async () => {
  const { MapContainer, TileLayer, Marker } = await import("react-leaflet");
  return function Comp({
    position,
    height = 160,
    zoom = 15,
  }: {
    position: { lat: number; lng: number };
    height?: number; zoom?: number;
  }) {
    return (
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
        <Marker position={position} />
      </MapContainer>
    );
  };
}, { ssr: false });

export function MapPreview(props: React.ComponentProps<typeof Inner>) {
  return <Inner {...props} />;
}
