// Article API Service
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5271/api';

export interface Article {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  tags: string[];
  featured: boolean;
  publishDate: string;
  createdAt?: string;
  updatedAt?: string;
  createdByUserId?: string;
  isPublished?: boolean;
}

// Get all published articles (public)
export async function getArticles(params?: {
  featured?: boolean;
  category?: string;
  limit?: number;
}): Promise<Article[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.featured !== undefined) queryParams.append('featured', String(params.featured));
    if (params?.category) queryParams.append('category', params.category);
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `${API_URL}/article${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// Get single article by slug (public)
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/article/${slug}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch article');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Create article (admin only)
export async function createArticle(article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: Article; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/article`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to create article' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating article:', error);
    return { success: false, error: 'Network error' };
  }
}

// Update article (admin only)
export async function updateArticle(slug: string, article: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: Article; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/article/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to update article' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating article:', error);
    return { success: false, error: 'Network error' };
  }
}

// Delete article (admin only)
export async function deleteArticle(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/article/${slug}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to delete article' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    return { success: false, error: 'Network error' };
  }
}

// Get all articles for admin (admin only)
export async function getAllArticlesAdmin(): Promise<{ success: boolean; data?: Article[]; error?: string }> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${API_URL}/article/admin/all`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to fetch articles' };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching articles:', error);
    return { success: false, error: 'Network error' };
  }
}
