"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ContactMapProps {
  lat: number;
  lng: number;
  title: string;
  address: string;
}

export function ContactMap({ lat, lng, title, address }: ContactMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(container, {
      center: [lat, lng],
      zoom: 16,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const customIcon = L.divIcon({
      className: "smart-electric-map-marker",
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#0ea5e9;color:#ffffff;border:3px solid #ffffff;box-shadow:0 6px 16px rgba(0,0,0,0.28);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -34],
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(
      `<div dir="rtl" style="font-family:inherit;text-align:right;min-width:180px;">
        <strong style="display:block;font-size:13px;margin-bottom:4px;">${title}</strong>
        <span style="font-size:11px;color:#52525b;">${address}</span>
      </div>`
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, title, address]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] sm:h-[340px] z-0"
      aria-label={title}
    />
  );
}
