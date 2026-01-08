const API_BASE_URL = "http://localhost:8000";

export interface UploadResponse {
  message: string;
  records: {
    id: string;
    file_name: string;
    file_type: string;
    created_at: string;
  }[];
}

export async function uploadFiles(files: File[]): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/api/upload/`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "Upload failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getRecords() {
  const response = await fetch(`${API_BASE_URL}/api/upload/records`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch records");
  return response.json();
}

export async function getTrends() {
  const response = await fetch(`${API_BASE_URL}/api/analyze/trends`, {
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to fetch trends");
  return response.json();
}

export async function getTrendsLatest() {
  const response = await fetch(`${API_BASE_URL}/api/analyze/trends/latest`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) {
      return null; // No trend data yet
    }
    throw new Error("Failed to fetch trends");
  }
  return response.json();
}

export async function getTimeline() {
  const response = await fetch(`${API_BASE_URL}/api/analyze/timeline/latest`, {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 404) {
      return null; // No timeline data yet
    }
    throw new Error("Failed to fetch timeline");
  }
  return response.json();
}

export async function startTrendAnalysis() {
  const response = await fetch(`${API_BASE_URL}/api/analyze/trends`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to start trend analysis");
  return response.json();
}

export async function startTimelineAnalysis() {
  const response = await fetch(`${API_BASE_URL}/api/analyze/timeline`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) throw new Error("Failed to start timeline analysis");
  return response.json();
}

export async function streamChat(
  message: string,
  context: Record<string, any> | null,
  onChunk: (text: string) => void,
  onError: (err: string) => void,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
      credentials: "include",
    });

    if (!response.ok) throw new Error("Chat request failed");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No reader available");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse SSE format (data: ...)
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            // The server sends raw string or json?
            // Based on chat.py: yield {"data": chunk} -> SSE does data: <content>
            // But sse-starlette might wrap it.
            // Let's assume it sends text content directly or wrapped JSON.
            // Checking chat.py: yield {"data": chunk} where chunk is string.
            // So data will probably be json string or just string.
            // actually sse-starlette json encodes the yield dict.
            // so data: "chunk content" (json string)
            // OR data: {"some": "json"}

            // Let's try to JSON parse.
            // Wait, sse-starlette formatting:
            // event: message
            // data: "chunk"

            // If chunk is simple string, it might be quote wrapped.
            // Let's try to parse if it looks like JSON/String, otherwise use raw
            onChunk(JSON.parse(data));
          } catch (e) {
            onChunk(data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function streamMedlm(
  message: string,
  context: Record<string, any> | null,
  onChunk: (text: string) => void,
  onError: (err: string) => void,
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/medlm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, context }),
      credentials: "include",
    });

    if (!response.ok) throw new Error("MedLM chat request failed");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No reader available");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse SSE format (data: ...)
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          try {
            // Try to parse as JSON first (in case it's wrapped)
            onChunk(JSON.parse(data));
          } catch (e) {
            // Otherwise use raw data
            onChunk(data);
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}

export function getStreamSource() {
  return new EventSource(`${API_BASE_URL}/api/stream`, {
    withCredentials: true,
  });
}
