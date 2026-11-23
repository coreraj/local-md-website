import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);

  /**
   * Sets the title, description, and social share tags (OG & Twitter) for the page.
   */
  setMetadata(config: { title: string; description: string; image?: string; path?: string }): void {
    const fullTitle = `${config.title} | Local MD`;
    const defaultImage = '/assets/homepage_hero.webp';
    const baseUrl = 'https://local-md.com';

    const imageUrl = config.image
      ? config.image.startsWith('http')
        ? config.image
        : `${baseUrl}${config.image}`
      : `${baseUrl}${defaultImage}`;
    const pageUrl = config.path ? `${baseUrl}${config.path}` : baseUrl;

    // Standard HTML tags
    this.titleService.setTitle(fullTitle);
    this.metaService.updateTag({ name: 'description', content: config.description });

    // Open Graph / Facebook
    this.metaService.updateTag({ property: 'og:title', content: fullTitle });
    this.metaService.updateTag({ property: 'og:description', content: config.description });
    this.metaService.updateTag({ property: 'og:image', content: imageUrl });
    this.metaService.updateTag({ property: 'og:url', content: pageUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: fullTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: config.description });
    this.metaService.updateTag({ name: 'twitter:image', content: imageUrl });
  }
}
