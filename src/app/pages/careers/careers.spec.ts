import { TestBed } from '@angular/core/testing';
import { SeoService } from '../../services/seo.service';
import { CareersComponent } from './careers';

describe('CareersComponent', () => {
  const paycomCareersUrl =
    'https://www.paycomonline.net/v4/ats/web.php/portal/4FD65BE5F92B4AB0C0B170A90E8B45EA/career-page';
  const seoService = {
    setMetadata: vi.fn(),
  };

  beforeEach(async () => {
    seoService.setMetadata.mockClear();

    await TestBed.configureTestingModule({
      imports: [CareersComponent],
      providers: [{ provide: SeoService, useValue: seoService }],
    }).compileComponents();
  });

  it('should render the Paycom careers portal and external fallback', async () => {
    const fixture = TestBed.createComponent(CareersComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const iframe = element.querySelector('iframe');
    const fallback = element.querySelector<HTMLAnchorElement>('.careers-portal-fallback');

    expect(iframe?.getAttribute('src')).toBe(paycomCareersUrl);
    expect(iframe?.getAttribute('title')).toBe('Current job openings at Local MD');
    expect(fallback?.getAttribute('href')).toBe(paycomCareersUrl);
    expect(fallback?.getAttribute('target')).toBe('_blank');
    expect(fallback?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should set Careers SEO metadata', () => {
    TestBed.createComponent(CareersComponent);

    expect(seoService.setMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Careers - Join the Local MD Team',
        path: '/careers',
      }),
    );
  });

  it('should render the hero section component with headline and CTA', async () => {
    const fixture = TestBed.createComponent(CareersComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const heroHeadline = element.querySelector('.hero-headline');
    const heroCta = element.querySelector<HTMLAnchorElement>('.hero-actions a');

    expect(heroHeadline?.textContent?.trim()).toBe(
      'Build a career that brings care closer to home.',
    );
    expect(heroCta?.getAttribute('href')).toBe('#open-positions');
    expect(heroCta?.textContent?.trim()).toBe('VIEW OPEN POSITIONS');
  });

  it('should scroll iframe frame into view when CTA button is clicked', async () => {
    const fixture = TestBed.createComponent(CareersComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(vi.fn());
    const target = fixture.nativeElement.querySelector('.careers-portal-shell');
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
        top: 300,
      } as DOMRect);
    }

    const heroCta = fixture.nativeElement.querySelector('.hero-actions a') as HTMLAnchorElement;
    heroCta?.click();

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 190,
      behavior: 'smooth',
    });

    scrollToSpy.mockRestore();
  });
});
