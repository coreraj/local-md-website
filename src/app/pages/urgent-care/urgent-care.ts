import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceCardComponent } from '../../components/shared/service-card/service-card';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';
import { CtaBannerComponent } from '../../components/shared/cta-banner/cta-banner';

@Component({
  selector: 'app-urgent-care',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, HeroComponent, CtaBannerComponent],
  templateUrl: './urgent-care.html',
  styleUrl: './urgent-care.css',
})
export class UrgentCareComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Urgent Care Services - Walk-In Medical Care',
      description:
        'Get fast, compassionate medical care for non-life-threatening illnesses and injuries. No appointment needed. Walk-ins are always welcome at Local MD.',
      image: '/assets/urgent_care_hero.webp',
      path: '/urgent-care',
    });
  }
}
