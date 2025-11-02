"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Post } from "./types";

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function usePosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch posts (all or only user's)
  const fetchPosts = async (onlyMine = false) => {
    setLoading(true);
    try {
      let query = supabase
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

      if (onlyMine && userId) query = query.eq("creator_id", userId);

      const { data, error } = await query;
      if (error) throw error;

      const mapped: Post[] = data.map((a: any) => ({
        id: a.id,
        user: {
          id: a.creator_id,
          name: a.profiles?.name ?? "Unknown",
          handle: a.profiles?.handle ?? "@anon",
          avatar: a.profiles?.avatar,
        },
        caption: a.title,
        liked: false,
        likes: 0,
        comments: 0,
        createdAt: a.created_at,
        location: undefined,
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
      const { error } = await supabase.from("activities").insert({
        title: p.caption,
        creator_id: p.user.id,
        description: "",
        max_participants: 0,
      });
      if (error) throw error;

      fetchPosts(true); // refresh your feed
      return true;
    } catch (err) {
      console.error("Failed to add post:", err);
      return false;
    }
  };

  // Delete a post
  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;

      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  useEffect(() => {
    fetchPosts(!!userId); // fetch only user's posts initially if userId is passed
  }, [userId]);

  return { posts, loading, fetchPosts, addPost, deletePost, setPosts };
}
