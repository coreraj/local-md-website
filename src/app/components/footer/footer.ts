import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoreIconComponent } from '../core-icon/core-icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, CoreIconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent {
  protected readonly currentYear = new Date().getFullYear();

  protected readonly payBillUrl = environment.links.payBill;
  protected readonly testResultsUrl = environment.links.testResults;

  // Social media configurations
  protected readonly socials = [
    { name: 'facebook', link: environment.links.facebook, label: 'Facebook' },
    { name: 'instagram', link: environment.links.instagram, label: 'Instagram' },
    { name: 'linkedin', link: environment.links.linkedin, label: 'LinkedIn' },
  ];

  isExternalLink(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }
}
