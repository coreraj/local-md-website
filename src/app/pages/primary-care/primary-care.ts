import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceCardComponent } from '../../components/shared/service-card/service-card';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';
import { CtaBannerComponent } from '../../components/shared/cta-banner/cta-banner';

@Component({
  selector: 'app-primary-care',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, HeroComponent, CtaBannerComponent],
  templateUrl: './primary-care.html',
  styleUrl: './primary-care.css',
})
export class PrimaryCareComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Comprehensive Primary Care Doctors & Family Medicine',
      description:
        'Our family medicine and primary care services focus on your long-term health. Schedule routine check-ups, chronic disease management, and preventive care with our doctors.',
      image: '/assets/primary_care_hero.webp',
      path: '/primary-care',
    });
  }
}
