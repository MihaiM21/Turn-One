'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Radio, Play, Pause, Volume2, User } from 'lucide-react';
import type { MappedF1Data } from '@/lib/f1DataMapper';
import { cn } from '@/lib/utils';
import { getTeamColor, F1_TEAMS } from '@/lib/constants/f1-teams';

interface LiveTeamRadioProps {
    radioMessages: MappedF1Data['teamRadio'];
    sessionPath?: string;
    className?: string;
}

const AudioPlayer = ({ src, autoPlay }: { src: string; autoPlay: boolean }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (autoPlay && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Autoplay blocked:", e));
        }
    }, [src, autoPlay]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(p || 0);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    return (
        <div className="flex items-center gap-2 w-full mt-2 bg-background/50 rounded-md p-1.5 border border-border/10">
            <button
                onClick={togglePlay}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>

            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                className="hidden"
            />
        </div>
    );
};

export function LiveTeamRadio({ radioMessages, sessionPath, className }: LiveTeamRadioProps) {
    const f1Url = "https://livetiming.formula1.com/static";

    return (
        <Card className={cn(
            "overflow-hidden border border-primary/10 shadow-xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md hover:border-primary/20",
            className
        )}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/90">
                        Team Radio
                    </span>
                </div>
                <Volume2 className="w-4 h-4 text-muted-foreground/50" />
            </div>

            <ScrollArea className="h-[300px]">
                <div className="divide-y divide-border/5">
                    {(!radioMessages || radioMessages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                            <Radio className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-xs">No audio comms</span>
                        </div>
                    ) : (
                        radioMessages.map((msg, idx) => (
                            <div key={`${msg.timestamp}-${idx}`} className="px-4 py-3 hover:bg-white/5 transition-colors group">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-5 h-5 rounded bg-primary/10 text-[10px] font-bold text-primary">
                                            {msg.driverNumber}
                                        </span>
                                        <span className="text-xs font-medium text-foreground/80">Driver Radio</span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground font-mono">{msg.timestamp}</span>
                                </div>

                                {sessionPath && (
                                    <AudioPlayer
                                        src={`${f1Url}/${sessionPath}${msg.path}`}
                                        autoPlay={idx === 0 && false} // Disable auto-play by default to avoid noise
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
