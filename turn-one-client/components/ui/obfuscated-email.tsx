"use client";

import { useEffect, useState } from "react";

interface ObfuscatedEmailProps {
  user: string;
  domain: string;
  className?: string;
  /** If true, renders as a clickable mailto: link. Otherwise renders as plain text. */
  asLink?: boolean;
}

/**
 * Renders an email address via client-side JavaScript to prevent
 * Cloudflare email obfuscation from replacing it with /cdn-cgi/l/email-protection links.
 * 
 * Usage: <ObfuscatedEmail user="contact" domain="t1f1.com" />
 */
export function ObfuscatedEmail({ user, domain, className, asLink = false }: ObfuscatedEmailProps) {
  const [email, setEmail] = useState<string | null>(null);

  // Render email only after hydration so it is absent from SSR HTML,
  // preventing Cloudflare Email Obfuscation from rewriting links.
  useEffect(() => {
    setEmail(`${user}@${domain}`);
  }, [user, domain]);

  if (!email) {
    return <span className={className} aria-hidden="true" />;
  }

  if (asLink) {
    return (
      <a href={`mailto:${email}`} className={className}>
        {email}
      </a>
    );
  }

  return <span className={className}>{email}</span>;
}
