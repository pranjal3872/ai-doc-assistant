import { API_URL, fetchWithAuth } from "./auth";

// Same backend as sign-in, so the gateway always accepts the user's token
export const RAG_GATEWAY_URL = `${API_URL}/api/rag`;

// All document/RAG requests go through the authenticated backend gateway so the
// RAG service only ever sees the signed-in user's ID.
export function ragFetch(endpoint: string, init?: RequestInit): Promise<Response> {
  return fetchWithAuth(`${RAG_GATEWAY_URL}${endpoint}`, init);
}
