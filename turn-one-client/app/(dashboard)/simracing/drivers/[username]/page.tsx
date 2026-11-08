"use client";

import { use, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SectionCard } from "@/components/dashboard/simracing/section-card";
import { formatLapTime, SimApiError } from "@/lib/simracing/api";
import { BOARD_SIMS, getPersonalBests, type PersonalBest } from "@/lib/simracing/leaderboards";

const simLabel = (s: string) => BOARD_SIMS.find(x => x.value === s)?.label ?? s;

/** A driver's personal bests per sim × track × car with their leaderboard rank (HF-05). */
export default function DriverPage({ params }: { params: Promise<{ username: string }> }) {
    const { username: raw } = use(params);
    const username = decodeURIComponent(raw);
    const [pbs, setPbs] = useState<PersonalBest[] | null>(null);
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        getPersonalBests(username)
            .then(setPbs)
            .catch(e => {
                if (e instanceof SimApiError && e.status === 404) setMissing(true);
                setPbs([]);
            });
    }, [username]);

    const podiums = pbs?.filter(p => p.rank > 0 && p.rank <= 3).length ?? 0;

    return (
        <main className="w-full space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <PageHeader
                label="Driver"
                title={username}
                description={missing ? "No driver with this name." : "Personal bests on every track and car, with leaderboard rank."}
                stats={[
                    { icon: Trophy, label: "Boards", value: pbs?.length ?? "—" },
                    { icon: Trophy, label: "Podiums", value: podiums, iconClassName: "text-yellow-400" },
                ]}
            />

            <SectionCard
                label="Personal bests"
                title="Fastest valid laps"
                icon={Trophy}
                loading={pbs === null}
                empty={pbs?.length === 0 ? "No ranked laps yet — or this driver keeps them private." : undefined}
                flush
            >
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            <th className="px-5 py-2 font-normal">Track</th>
                            <th className="px-2 py-2 font-normal">Car</th>
                            <th className="px-2 py-2 text-right font-normal">Time</th>
                            <th className="px-5 py-2 text-right font-normal">Rank</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pbs?.map(p => (
                            <tr key={p.lapId} className="border-b border-border/60">
                                <td className="px-5 py-2 text-white">
                                    {p.trackName} <span className="text-xs text-muted-foreground">· {simLabel(p.source)}</span>
                                </td>
                                <td className="px-2 py-2 text-foreground/85">{p.carName}</td>
                                <td className="px-2 py-2 text-right font-mono tabular-nums text-white">{formatLapTime(p.lapTimeMs)}</td>
                                <td className="px-5 py-2 text-right font-mono tabular-nums text-muted-foreground">
                                    {p.rank > 0 ? `#${p.rank} / ${p.total}` : "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </SectionCard>
        </main>
    );
}
