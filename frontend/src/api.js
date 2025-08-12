export const API_BASE = "http://localhost:5000/api";

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/conversations`);
  return res.json();
}

export async function fetchMessages(wa_id) {
  const res = await fetch(`${API_BASE}/messages/${encodeURIComponent(wa_id)}`);
  return res.json();
}

export async function sendMessage(wa_id, text) {
  const res = await fetch(`${API_BASE}/messages/${encodeURIComponent(wa_id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender: "me", text })
  });
  return res.json();
}
