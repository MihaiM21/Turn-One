"use client";

import { useMemo } from "react";

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
  const email = useMemo(() => `${user}@${domain}`, [user, domain]);

  if (asLink) {
    return (
      <a href={`mailto:${email}`} className={className}>
        {email}
      </a>
    );
  }

  return <span className={className}>{email}</span>;
}
