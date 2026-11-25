"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // First install also fires controllerchange (clients.claim); only reload on updates.
    const hadController = !!navigator.serviceWorker.controller;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "activated" &&
              hadController
            ) {
              window.location.reload();
            }
          });
        });
      });

    // Also handle the case where a new SW claimed this client
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing || !hadController) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}
