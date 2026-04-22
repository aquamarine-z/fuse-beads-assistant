"use client";

import {useEffect} from "react";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const disableOfflineSupport = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();

      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)));
      }
    };

    void disableOfflineSupport();
  }, []);

  return null;
}
