import axios from "axios";
import { Post } from "@/app/page";

const API_URL = "https://your-backend-api.com";

export async function fetchPosts(): Promise<Post[]> {
  const res = await axios.get(`${API_URL}/posts`);
  return res.data;
}

export async function createPost(post: Post): Promise<Post> {
  const res = await axios.post(`${API_URL}/posts`, post);
  return res.data;
}

export async function toggleLike(id: string): Promise<Post> {
  const res = await axios.post(`${API_URL}/posts/${id}/like`);
  return res.data;
}

export async function joinActivity(id: string): Promise<Post> {
  const res = await axios.post(`${API_URL}/posts/${id}/join`);
  return res.data;
}
