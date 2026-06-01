import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Turn One Overlay",
    robots: { index: false, follow: false },
};

export default function OverlayLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen w-full text-white"
            style={{ background: "transparent" }}
        >
            {children}
        </div>
    );
}
