/**
 * Breadcrumb Navigation Component with SEO
 * Provides both visual navigation and structured data for search engines
 */

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { JsonLd } from '@/components/seo/json-ld'
import { generateBreadcrumbSchema } from '@/lib/seo'

export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // Generate structured data
  const breadcrumbSchema = generateBreadcrumbSchema(items)

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd data={breadcrumbSchema} />

      {/* Visual Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className={className}>
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
                )}
                {isLast ? (
                  <span className="font-medium text-foreground" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.url}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}

