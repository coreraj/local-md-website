import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-terms-of-use',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms-of-use.html',
  styleUrl: './terms-of-use.css',
})
export class TermsOfUseComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Website Terms of Use',
      description:
        'Review the rules, guidelines, and legal agreements governing the use of the Local MD Urgent Care website and online services.',
      image: '/assets/logo.webp',
      path: '/terms-of-use',
    });
  }

  printPage(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
