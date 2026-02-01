/**
 * SEO Component with structured data support
 */

import Head from 'next/head'
import { JsonLd } from './json-ld'

interface SEOComponentProps {
  structuredData?: object | object[]
}

export function SEOComponent({ structuredData }: SEOComponentProps) {
  if (!structuredData) return null
  
  return (
    <>
      <JsonLd data={structuredData} />
    </>
  )
}
