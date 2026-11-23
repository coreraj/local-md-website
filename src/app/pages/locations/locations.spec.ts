import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LocationsComponent } from './locations';

describe('Locations without a configured Maps key', () => {
  it('keeps clinic selection working on the fallback map without loading Google', async () => {
    expect(environment.googleMapsApiKey).toBe('');
    await TestBed.configureTestingModule({
      imports: [LocationsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(LocationsComponent);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const markers = element.querySelectorAll<HTMLElement>('.fallback-marker');

    expect(element.querySelector('.simulated-map-viewport')).not.toBeNull();
    expect(markers).toHaveLength(10);
    const positions = [...markers].map((marker) => `${marker.style.left},${marker.style.top}`);
    expect(new Set(positions).size).toBe(10);
    for (const marker of markers) {
      expect(parseFloat(marker.style.left)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(marker.style.left)).toBeLessThanOrEqual(92);
      expect(parseFloat(marker.style.top)).toBeGreaterThanOrEqual(8);
      expect(parseFloat(marker.style.top)).toBeLessThanOrEqual(92);
    }
    markers[0].click();
    await fixture.whenStable();
    expect(element.querySelector('.custom-map-card .card-title')?.textContent).toContain(
      'Columbus',
    );
    expect(document.head.querySelector('script[src*="maps.googleapis.com"]')).toBeNull();
    expect(element.textContent).not.toMatch(/Visit number|SHORT TIME OF WAITING|\bBUSY\b/);
    expect(element.querySelector('.custom-map-card a')?.getAttribute('href')).toMatch(
      /^https:\/\//,
    );
    expect(element.querySelectorAll('.clinic-card .spot-btn')).toHaveLength(10);
  });
});
