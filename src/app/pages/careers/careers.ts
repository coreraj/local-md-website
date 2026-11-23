import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HeroComponent } from '../../components/shared/hero/hero';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [HeroComponent],
  templateUrl: './careers.html',
  styleUrl: './careers.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CareersComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Careers - Join the Local MD Team',
      description:
        'Explore career opportunities at Local MD and view current openings across our urgent care, primary care, laboratory, and occupational health teams.',
      image: '/assets/careers_hero.webp',
      path: '/careers',
    });
  }

  scrollToIframe(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    const target =
      document.querySelector('.careers-portal-shell') ||
      document.querySelector('.careers-portal-frame') ||
      document.querySelector('iframe');
    if (target) {
      const headerOffset = 110;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }
}
