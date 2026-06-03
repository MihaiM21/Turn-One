import { Button } from "@/components/ui/button"
import { Tv } from "lucide-react"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-1.7 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.2 14.6 2.3 12 2.3 6.7 2.3 2.4 6.6 2.4 11.9S6.7 21.5 12 21.5c6.9 0 9.4-4.8 9.4-7.4 0-.5-.1-.9-.1-1.3H12z" />
    </svg>
  )
}

export function OAuthButtons() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          disabled
          title="Coming soon"
          className="h-11 cursor-not-allowed"
        >
          <GoogleIcon className="size-4" />
          <span className="font-medium">Google</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled
          title="Coming soon"
          className="h-11 cursor-not-allowed"
        >
          <Tv className="size-4 text-primary" />
          <span className="font-medium">F1 TV</span>
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span className="tracking-widest">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
