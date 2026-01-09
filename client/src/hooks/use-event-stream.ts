import { useEffect, useRef } from "react";
import { getStreamSource } from "../lib/api";

export function useEventStream(onMessage: (event: any) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const eventSource = getStreamSource();

    eventSource.onmessage = (event) => {
      try {
        console.log("📡 SSE Event Received:", event.data);

        let parsedData = event.data;
        try {
          parsedData = JSON.parse(event.data);
          console.log("📦 Parsed SSE Data:", parsedData);

          // Log standardized events
          if (parsedData.type && parsedData.status) {
            console.log(`📡 [SSE] ${parsedData.type} (${parsedData.status}): ${parsedData.message}`);
          }
        } catch (e) {
          // keep as string
          console.log("📄 SSE Data (non-JSON):", parsedData);
        }
        onMessageRef.current(parsedData);
      } catch (error) {
        console.error("SSE Error parsing:", error);
      }
    };

    eventSource.onerror = (err) => {
      console.error("❌ EventSource failed:", err);
      console.log("Connection state:", eventSource.readyState);
      // Retry logic is often handled by browser, but we can manage here if needed
      // eventSource.close()
    };

    eventSource.onopen = () => {
      console.log("✅ SSE Connection opened successfully");
    };

    return () => {
      eventSource.close();
    };
  }, []);
}
