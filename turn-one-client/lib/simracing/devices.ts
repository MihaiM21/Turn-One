/**
 * Turn One Link device pairing (HCR-006): approve the code Link shows, list and revoke devices.
 */

import { request } from "@/lib/simracing/api";

export interface PendingPairing {
    userCode: string;
    deviceName: string;
    platform: string;
    appVersion: string | null;
    createdAt: string;
    approved: boolean;
}

export interface LinkDevice {
    id: string;
    name: string;
    platform: string;
    appVersion: string | null;
    createdAt: string;
    lastSeenAt: string | null;
}

/** "k7qf2m9d" / "K7QF 2M9D" → "K7QF-2M9D"; null until it has 8 letters/digits. */
export function normalizeUserCode(input: string): string | null {
    const chars = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return chars.length === 8 ? `${chars.slice(0, 4)}-${chars.slice(4)}` : null;
}

export const getPairing = (userCode: string) =>
    request<PendingPairing>(`/api/devices/pair/${encodeURIComponent(userCode)}`);

export const approvePairing = (userCode: string) =>
    request<void>(`/api/devices/pair/${encodeURIComponent(userCode)}/approve`, { method: "POST" });

export const listDevices = () => request<LinkDevice[]>("/api/devices");

export const revokeDevice = (id: string) => request<void>(`/api/devices/${id}`, { method: "DELETE" });
