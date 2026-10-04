import { fetchWithAuth } from "./auth";

export const RAG_GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/rag`
  : "http://localhost:5000/api/rag";

// All document/RAG requests go through the authenticated backend gateway so the
// RAG service only ever sees the signed-in user's ID.
export function ragFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  return fetchWithAuth(`${RAG_GATEWAY_URL}${endpoint}`, init);
}
