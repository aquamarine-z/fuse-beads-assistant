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

    let activeRegistration: ServiceWorkerRegistration | null = null;

    const registerServiceWorker = async () => {
      activeRegistration = await navigator.serviceWorker.register("/sw.js", {scope: "/"});
    };

    const handleOnline = () => {
      void activeRegistration?.update();
    };

    void registerServiceWorker();
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
