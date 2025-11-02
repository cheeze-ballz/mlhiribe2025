import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

export function Composer({ onCreate }: { onCreate: (p: Post) => Promise<void> }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [people, setPeople] = useState(""); // new field
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleCreate = async () => {
    if (!caption.trim() && !people.trim()) return;
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
      location: undefined,
      placeName: "",
      tags: [],
      imageUrl: undefined,
      extra: { people: people.split(/\s+/).filter((p) => p.startsWith("#")) }, // store #people
    };

    await onCreate(newPost);
    setCaption("");
    setPeople("");
    setBusy(false);
  };

  return (
    <Card className="p-4 space-y-2">
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
      <Button onClick={handleCreate} disabled={busy || (!caption.trim() && !people.trim())}>
        {busy ? "Posting…" : "Post"}
      </Button>
    </Card>
  );
}
