import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ServiceCardComponent } from '../../components/shared/service-card/service-card';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';
import { CtaBannerComponent } from '../../components/shared/cta-banner/cta-banner';

@Component({
  selector: 'app-injury',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, HeroComponent, CtaBannerComponent],
  templateUrl: './injury.html',
  styleUrl: './injury.css',
})
export class InjuryComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: "Workers' Comp & Workplace Injury Care Specialists",
      description:
        "Our dedicated team provides professional medical care for workplace injuries, rehabilitation, and streamlined workers' compensation case management.",
      image: '/assets/dme_hero.webp',
      path: '/injury-care',
    });
  }
}
