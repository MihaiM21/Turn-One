"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Laptop, Link2, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimApiError } from "@/lib/simracing/api";
import { getAiConsent, setAiConsent, type AiConsent } from "@/lib/simracing/leaderboards";
import {
    approvePairing,
    getPairing,
    listDevices,
    normalizeUserCode,
    revokeDevice,
    type LinkDevice,
    type PendingPairing,
} from "@/lib/simracing/devices";

type Step =
    | { kind: "enter" }
    | { kind: "confirm"; pairing: PendingPairing }
    | { kind: "done"; deviceName: string }
    | { kind: "error"; message: string };

/**
 * turnonehub.com/link — where a Turn One Link install is approved (HCR-006). Link opens this page
 * with ?code=XXXX-XXXX; the signed-in user checks the device name and approves it. Below, the
 * user's paired devices, each revocable.
 */
export default function LinkDevicePage() {
    const [code, setCode] = useState("");
    const [step, setStep] = useState<Step>({ kind: "enter" });
    const [busy, setBusy] = useState(false);
    const [devices, setDevices] = useState<LinkDevice[] | null>(null);
    const [consent, setConsent] = useState<AiConsent | null>(null);

    const refreshDevices = useCallback(() => {
        listDevices()
            .then(setDevices)
            .catch(() => setDevices([]));
    }, []);

    const lookUp = useCallback(async (raw: string) => {
        const normalized = normalizeUserCode(raw);
        if (!normalized) {
            setStep({ kind: "error", message: "Enter the 8-character code shown in Turn One Link." });
            return;
        }
        setBusy(true);
        try {
            const pairing = await getPairing(normalized);
            setStep(pairing.approved
                ? { kind: "done", deviceName: pairing.deviceName }
                : { kind: "confirm", pairing });
        } catch (e) {
            setStep({
                kind: "error",
                message: e instanceof SimApiError && e.status === 404
                    ? "This code has expired or doesn't exist. Start sign-in again in Turn One Link."
                    : "Couldn't check the code. Try again.",
            });
        } finally {
            setBusy(false);
        }
    }, []);

    useEffect(() => {
        getAiConsent().then(setConsent).catch(() => setConsent(null));
    }, []);

    const toggleConsent = async (granted: boolean) => {
        if (!consent) return;
        const previous = consent;
        setConsent({ ...consent, granted });
        try {
            await setAiConsent(granted, consent.version);
        } catch {
            setConsent(previous);
        }
    };

    useEffect(() => {
        refreshDevices();
        const fromUrl = new URLSearchParams(window.location.search).get("code");
        if (fromUrl) {
            setCode(fromUrl);
            void lookUp(fromUrl);
        }
    }, [lookUp, refreshDevices]);

    const approve = async (pairing: PendingPairing) => {
        setBusy(true);
        try {
            await approvePairing(pairing.userCode);
            setStep({ kind: "done", deviceName: pairing.deviceName });
            // Link collects its tokens on its next poll; the device shows up here a moment later.
            setTimeout(refreshDevices, 6000);
        } catch (e) {
            setStep({ kind: "error", message: e instanceof Error ? e.message : "Approval failed." });
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (device: LinkDevice) => {
        if (!window.confirm(`Sign out Turn One Link on ${device.name}? It will need to be paired again.`)) return;
        await revokeDevice(device.id).catch(() => undefined);
        refreshDevices();
    };

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Turn One Link"
                title="Connect your PC"
                description="Approve the code Turn One Link shows to sign it in to your account. Link never sees your password."
            />

            <SectionCard label="Sign in" title="Device code" icon={Link2}>
                {step.kind === "done" ? (
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                        <div>
                            <p className="font-semibold text-white">{step.deviceName} is connected.</p>
                            <p className="mt-1 text-sm text-zinc-400">
                                You can close this tab — Turn One Link finishes signing in by itself.
                            </p>
                        </div>
                    </div>
                ) : step.kind === "confirm" ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                            <div>
                                <p className="font-semibold text-white">
                                    Sign in Turn One Link on <span className="text-primary">{step.pairing.deviceName}</span>?
                                </p>
                                <p className="mt-1 text-sm text-zinc-400">
                                    Code <span className="font-mono text-white">{step.pairing.userCode}</span>
                                    {step.pairing.appVersion ? ` · Link ${step.pairing.appVersion}` : ""} · requested{" "}
                                    {formatDistanceToNow(new Date(step.pairing.createdAt), { addSuffix: true })}
                                </p>
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/90">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    Only approve a code you see on your own screen right now.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => approve(step.pairing)} disabled={busy}>
                                Approve
                            </Button>
                            <Button variant="ghost" onClick={() => setStep({ kind: "enter" })} disabled={busy}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <form
                        className="flex flex-col gap-3 sm:flex-row sm:items-start"
                        onSubmit={e => {
                            e.preventDefault();
                            void lookUp(code);
                        }}
                    >
                        <div className="flex-1">
                            <Input
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="XXXX-XXXX"
                                autoComplete="off"
                                spellCheck={false}
                                className="font-mono uppercase tracking-widest"
                                aria-label="Device code"
                            />
                            {step.kind === "error" ? (
                                <p className="mt-2 text-sm text-red-400">{step.message}</p>
                            ) : (
                                <p className="mt-2 text-xs text-zinc-500">
                                    In Turn One Link, click &quot;Sign in&quot; — the code appears there.
                                </p>
                            )}
                        </div>
                        <Button type="submit" disabled={busy}>Continue</Button>
                    </form>
                )}
            </SectionCard>

            <SectionCard
                label="Your devices"
                title="Signed-in Turn One Link installs"
                icon={Laptop}
                loading={devices === null}
                empty={devices?.length === 0 ? "No devices yet." : undefined}
                flush
            >
                <ul className="divide-y divide-zinc-800">
                    {devices?.map(d => (
                        <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{d.name}</p>
                                <p className="text-xs text-zinc-500">
                                    {d.appVersion ? `Link ${d.appVersion} · ` : ""}
                                    {d.lastSeenAt
                                        ? `active ${formatDistanceToNow(new Date(d.lastSeenAt), { addSuffix: true })}`
                                        : `added ${formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}`}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => revoke(d)} aria-label={`Sign out ${d.name}`}>
                                <Trash2 className="h-4 w-4" />
                                Sign out
                            </Button>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            {consent ? (
                <SectionCard label="Your data" title="Help train the Turn One coach" icon={Sparkles}>
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[var(--primary)]"
                            checked={consent.granted}
                            onChange={e => toggleConsent(e.target.checked)}
                        />
                        <span className="text-sm text-zinc-300">
                            Use my laps and my 👍/👎 on coaching tips to train Turn One&apos;s own coaching model.
                            <span className="mt-1 block text-xs text-zinc-500">
                                Optional and off unless you turn it on. Exports are pseudonymised; turning it off removes your
                                data from future training sets. Your laps are stored and analysed either way.
                            </span>
                        </span>
                    </label>
                </SectionCard>
            ) : null}
        </main>
    );
}
