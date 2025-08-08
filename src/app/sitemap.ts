import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://interviewprep.ai';
  
  // Static pages
  const staticPages = [
    '',
    '/pricing',
    '/login',
    '/signup',
    '/about',
    '/features',
    '/practice',
    '/practice-buddy',
    '/achievements',
    '/blog',
    '/careers',
    '/privacy',
    '/terms',
    '/contact',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Industry-specific pages for SEO
  const industries = [
    'technology',
    'finance',
    'healthcare',
    'retail',
    'education',
    'marketing',
    'sales',
    'engineering',
    'consulting',
    'hospitality',
    'manufacturing',
    'nonprofit',
  ];

  const industryPages = industries.map((industry) => ({
    url: `${baseUrl}/industries/${industry}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Question type pages for SEO
  const questionTypes = [
    'behavioral',
    'technical',
    'situational',
    'competency',
    'culture-fit',
    'case-study',
  ];

  const questionPages = questionTypes.map((type) => ({
    url: `${baseUrl}/questions/${type}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Blog posts (example - would be dynamic in production)
  const blogPosts = [
    'how-to-answer-tell-me-about-yourself',
    'star-method-interview-technique',
    'common-interview-mistakes-to-avoid',
    'salary-negotiation-tips',
    'video-interview-best-practices',
    'thank-you-email-after-interview',
  ].map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...industryPages, ...questionPages, ...blogPosts];
}