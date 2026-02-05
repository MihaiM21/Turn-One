/**
 * JSON-LD Script Component
 * Renders structured data for SEO
 */

interface JsonLdProps {
  data: object | object[]
}

export function JsonLd({ data }: JsonLdProps) {
  const jsonLdData = Array.isArray(data) ? data : [data]
  
  return (
    <>
      {jsonLdData.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item, null, 0),
          }}
        />
      ))}
    </>
  )
}
