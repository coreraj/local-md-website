import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-accessibility',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './accessibility.html',
  styleUrl: './accessibility.css',
})
export class AccessibilityComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Accessibility Statement',
      description:
        'Review our commitment to digital accessibility, ADA compliance, and WCAG guidelines at Local MD Urgent Care.',
      image: '/assets/logo.webp',
      path: '/accessibility',
    });
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
