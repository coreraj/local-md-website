import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceCardComponent } from '../../components/shared/service-card/service-card';
import { IconComponent } from '../../components/icon/icon';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';

@Component({
  selector: 'app-lab-diagnostics',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, IconComponent, HeroComponent],
  templateUrl: './lab-diagnostics.html',
  styleUrl: './lab-diagnostics.css',
})
export class LabDiagnosticsComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'On-Site Lab Diagnostics & Clinical Tests',
      description:
        'Get quick and accurate results with our on-site lab diagnostics. We offer blood tests, strep screens, COVID testing, drug screenings, and other clinical tests.',
      image: '/assets/lab_hero.webp',
      path: '/lab-diagnostics',
    });
  }
}
