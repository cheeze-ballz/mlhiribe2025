"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";
import MapPicker from "@/components/MapPicker";

/* lightweight reverse-geocoder (free OSM/Nominatim; dev use only) */
async function reverseGeocodeFree(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return;
    const data = await res.json();
    return data?.name || data?.display_name;
  } catch {
    return;
  }
}

export function Composer({ onCreate }: { onCreate: (p: Post) => Promise<void> }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [people, setPeople] = useState(""); // new field (unchanged)
  const [busy, setBusy] = useState(false);

  // NEW: map states
  const [loc, setLoc] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [placeName, setPlaceName] = useState<string | undefined>(undefined);

  // when pin changes, resolve a human-friendly place name
  useEffect(() => {
    let alive = true;
    const go = async () => {
      if (!loc) { setPlaceName(undefined); return; }
      const name = await reverseGeocodeFree(loc.lat, loc.lng);
      if (alive) setPlaceName(name);
    };
    const t = setTimeout(go, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [loc]);

  if (!user) return null;

  const handleCreate = async () => {
    if (!caption.trim() && !people.trim() && !loc) return;
    setBusy(true);

    const newPost: Post = {
      id: crypto.randomUUID(),
      user: {
        id: user.id,
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
      },
      caption,
      liked: false,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString(),
      // include map data
      location: loc,                         // { lat, lng } or undefined
      placeName: placeName || "",            // human label if available
      // unchanged extras
      tags: [],
      imageUrl: undefined,
      // if your Post type has `extra?: Record<string, any>`
      extra: { people: people.split(/\s+/).filter((p) => p.startsWith("#")) },
    };

    await onCreate(newPost);
    setCaption("");
    setPeople("");
    setLoc(undefined);
    setPlaceName(undefined);
    setBusy(false);
  };

  return (
    <Card className="p-4 space-y-3">
      {/* Leaflet CSS (safe to include here even if also in layout) */}
      <Head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </Head>

      {/* Map picker */}
      <div className="space-y-2">
        <div className="text-sm font-medium">Pin a location (optional)</div>
        <MapPicker value={loc} onChange={setLoc} height={260} zoom={15} />
        {loc && (
          <div className="text-xs text-muted-foreground">
            Selected: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
          </div>
        )}
        {placeName && (
          <div className="text-xs text-muted-foreground">Looks like: {placeName}</div>
        )}
      </div>

      {/* Caption & people (unchanged) */}
      <Textarea
        placeholder="Write a caption…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="min-h-[80px]"
      />
      <Textarea
        placeholder="Add #people to join"
        value={people}
        onChange={(e) => setPeople(e.target.value)}
        className="min-h-[40px]"
      />

      <Button onClick={handleCreate} disabled={busy || (!caption.trim() && !people.trim() && !loc)}>
        {busy ? "Posting…" : "Post"}
      </Button>
    </Card>
  );
}
