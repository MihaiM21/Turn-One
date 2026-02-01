import { generateSEO } from "@/lib/seo"
import { ArticleEditor } from "@/components/admin/article-editor"

export const metadata = generateSEO({
  title: "Create Article - Admin Dashboard",
  description: "Create a new F1 article",
  noIndex: true,
})

export default function CreateArticlePage() {
  return <ArticleEditor mode="create" />
}
