"use client";
import { useState, useEffect } from "react";
import type { Post } from "./types";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts with user info
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          profiles:creator_id (
            id,
            name,
            handle,
            avatar
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Post[] = data.map((a: any) => ({
        id: a.id,
        user: {
          name: a.profiles?.name ?? "Unknown",
          handle: a.profiles?.handle ?? "@anon",
          avatar: a.profiles?.avatar,
        },
        caption: a.title,
        liked: false,
        likes: 0,
        comments: 0,
        createdAt: a.created_at,
        location: undefined, // can extend later
        placeName: "",
        tags: [],
        imageUrl: undefined,
      }));

      setPosts(mapped);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Add a new post
  const addPost = async (p: Post) => {
    try {
      const { data, error } = await supabase.from("activities").insert({
        title: p.caption,
        creator_id: p.user.id, // must match profiles.id
        description: "",
        max_participants: 0,
      });

      if (error) throw error;

      // Fetch latest posts again
      fetchPosts();
      return true;
    } catch (err) {
      console.error("Failed to add post:", err);
      return false;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return { posts, loading, fetchPosts, addPost };
}
