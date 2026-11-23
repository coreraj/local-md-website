import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-hipaa-notice',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './hipaa-notice.html',
  styleUrl: './hipaa-notice.css',
})
export class HIPAAComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Notice of Privacy Practices (HIPAA)',
      description:
        'Review our Notice of Privacy Practices regarding Protected Health Information (PHI) under federal HIPAA regulations at Local MD Urgent Care.',
      image: '/assets/logo.webp',
      path: '/hipaa-notice',
    });
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
