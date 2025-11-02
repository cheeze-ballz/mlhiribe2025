import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { useAuth } from "@/lib/auth";
import type { Post } from "@/lib/types";

export function Composer({ onCreate }: { onCreate: (p: Post) => Promise<void> }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  const handleCreate = async () => {
    if (!caption.trim()) return;
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
    };

    await onCreate(newPost);
    setCaption("");
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
      <Button onClick={handleCreate} disabled={busy || !caption.trim()}>
        {busy ? "Posting…" : "Post"}
      </Button>
    </Card>
  );
}
