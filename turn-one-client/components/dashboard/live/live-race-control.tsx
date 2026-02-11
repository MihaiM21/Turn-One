'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Flag } from 'lucide-react';
import type { MappedF1Data } from '@/lib/f1DataMapper';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface LiveRaceControlProps {
    messages: MappedF1Data['raceControlMessages'];
    className?: string;
}

export function LiveRaceControl({ messages, className }: LiveRaceControlProps) {
    const sortedMessages = useMemo(() => {
        return messages?.sort((a, b) => b.timestamp.localeCompare(a.timestamp)) || [];
    }, [messages]);

    return (
        <Card className={cn(
            "overflow-hidden border border-primary/10 shadow-xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-md hover:border-primary/20",
            className
        )}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/10">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-primary/90">
                        Race Control
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Live</span>
                </div>
            </div>

            <ScrollArea className="h-[280px]">
                <div className="divide-y divide-border/5">
                    {sortedMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
                            <Flag className="w-8 h-8 mb-2 opacity-20" />
                            <span className="text-xs">No messages yet</span>
                        </div>
                    ) : (
                        sortedMessages.map((msg, idx) => (
                            <div key={`${msg.timestamp}-${idx}`} className="px-4 py-3 hover:bg-white/5 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] px-1.5 py-0 h-5 border-0 font-bold",
                                        msg.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                                            msg.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-500' :
                                                'bg-blue-500/10 text-blue-500'
                                    )}>
                                        {msg.category}
                                    </Badge>
                                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                                        {msg.timestamp}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-foreground/90 font-medium">
                                    {msg.message}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
}
