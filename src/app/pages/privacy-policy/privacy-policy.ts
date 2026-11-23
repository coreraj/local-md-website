import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.css',
})
export class PrivacyPolicyComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Website Privacy Policy',
      description:
        'Review our policy regarding how we collect, use, and safeguard personal information gathered through the Local MD Urgent Care website.',
      image: '/assets/logo.webp',
      path: '/privacy-policy',
    });
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
