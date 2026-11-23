import { Component, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CoreIconComponent } from '../../components/core-icon/core-icon';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';

interface LocationHours {
  monFri: string;
  sat: string;
  sun: string;
}

interface LocationItem {
  id: string;
  name: string;
  state: 'Illinois' | 'Indiana';
  address: string;
  phone: string;
  zip: string;
  reserveUrl?: string;
  lat: number;
  lng: number;
  distance?: number;
  hours: LocationHours;
}

const DEFAULT_HOURS: LocationHours = {
  monFri: '8:00a–8:00p',
  sat: '9:00a–5:00p',
  sun: '9:00a–5:00p',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CoreIconComponent, HeroComponent, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent {
  private readonly platformId = inject(PLATFORM_ID);

  constructor() {
    inject(SeoService).setMetadata({
      title: 'Local MD - Convenient Urgent Care, Primary Care & Lab Services',
      description:
        'Local MD is your trusted local healthcare provider. We offer walk-in urgent care, primary care, occupational health, injury care, and fast on-site lab diagnostics at multiple locations.',
      image: '/assets/homepage_hero.webp',
      path: '/home',
    });
  }

  // Selected clinic ID for the homepage hero Working Time Card
  protected readonly selectedLocationId = signal<string>('homewood');

  // Clinic data is also maintained in src/app/pages/locations/locations.ts.
  // Update both lists when clinic details change. They are not synchronized automatically.
  protected readonly locationsList = signal<LocationItem[]>([
    {
      id: 'columbus',
      name: 'Columbus',
      state: 'Indiana',
      address: '3019 N National Rd, Columbus, IN 47203',
      phone: '708-922-0911',
      zip: '47203',
      reserveUrl: 'https://www.clockwisemd.com/visit/14687',
      lat: 39.2272,
      lng: -85.8972,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'decatur',
      name: 'Decatur',
      state: 'Illinois',
      address: '4195 N Water St, Decatur, IL 62526',
      phone: '708-922-0911',
      zip: '62526',
      reserveUrl: 'https://www.clockwisemd.com/visit/14690',
      lat: 39.8856,
      lng: -88.9515,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'homewood',
      name: 'Homewood',
      state: 'Illinois',
      address: '17960 South Halsted Street, Homewood, IL 60430',
      phone: '708-922-0911',
      zip: '60430',
      reserveUrl: 'https://www.clockwisemd.com/visit/15569',
      lat: 41.5645,
      lng: -87.6405,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'martinsville',
      name: 'Martinsville',
      state: 'Indiana',
      address: '630 Birk Rd, Martinsville, IN 46151',
      phone: '708-922-0911',
      zip: '46151',
      reserveUrl: 'https://www.clockwisemd.com/visit/14691',
      lat: 39.4125,
      lng: -86.4178,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'melrose-park',
      name: 'Melrose Park',
      state: 'Illinois',
      address: '600 W North Ave, Melrose Park, IL 60160',
      phone: '708-922-0911',
      zip: '60160',
      reserveUrl: 'https://www.clockwisemd.com/visit/14692',
      lat: 41.9095,
      lng: -87.8715,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'norridge',
      name: 'Norridge',
      state: 'Illinois',
      address: '4460 N. Harlem, Norridge, IL 60706',
      phone: '708-922-0911',
      zip: '60706',
      reserveUrl: 'https://www.clockwisemd.com/visit/16681',
      lat: 41.9602,
      lng: -87.8071,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'palatine',
      name: 'Palatine',
      state: 'Illinois',
      address: '770 E Dundee Rd, Palatine, IL 60074',
      phone: '708-922-0911',
      zip: '60074',
      reserveUrl: 'https://www.clockwisemd.com/visit/18713',
      lat: 42.1395,
      lng: -88.0245,
      hours: { monFri: '9:00a–7:00p', sat: '9:00a–2:00p', sun: '9:00a–2:00p' },
    },
    {
      id: 'pullman',
      name: 'Pullman',
      state: 'Illinois',
      address: '10834 South Doty Avenue, Chicago, IL 60628',
      phone: '708-922-0911',
      zip: '60628',
      reserveUrl: 'https://www.clockwisemd.com/visit/15570',
      lat: 41.6923,
      lng: -87.5997,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'warsaw',
      name: 'Warsaw',
      state: 'Indiana',
      address: '2680 Escalade Way, Warsaw, IN 46582',
      phone: '708-922-0911',
      zip: '46582',
      reserveUrl: 'https://www.clockwisemd.com/visit/16682',
      lat: 41.2381,
      lng: -85.8569,
      hours: DEFAULT_HOURS,
    },
    {
      id: 'zion',
      name: 'Zion',
      state: 'Illinois',
      address: '2015 Sheridan Rd, Zion, IL 60099',
      phone: '708-922-0911',
      zip: '60099',
      reserveUrl: 'https://www.clockwisemd.com/visit/14693',
      lat: 42.4455,
      lng: -87.8431,
      hours: { monFri: '9:00a–5:00p', sat: 'Closed', sun: 'Closed' },
    },
  ]);

  // Computed selected location object
  protected readonly selectedClinic = computed<LocationItem>(() => {
    return (
      this.locationsList().find((c) => c.id === this.selectedLocationId()) ||
      this.locationsList()[0]
    );
  });

  // Geolocation and Sort signals
  protected readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  protected readonly isGeoLoading = signal<boolean>(false);
  protected readonly geoError = signal<string | null>(null);

  // Computed state filtering the locations array reactively by proximity if userLocation is available
  protected readonly filteredLocations = computed<LocationItem[]>(() => {
    let clinics = this.locationsList();
    const userLoc = this.userLocation();

    if (userLoc) {
      clinics = clinics.map((clinic) => {
        const dist = this.calculateDistance(userLoc.lat, userLoc.lng, clinic.lat, clinic.lng);
        return { ...clinic, distance: dist };
      });

      // Sort by proximity
      clinics.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else {
      clinics = clinics.map((c) => ({ ...c, distance: undefined }));
    }

    return clinics;
  });

  // Geolocation request handler
  protected requestUserLocation(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (navigator.geolocation) {
      this.isGeoLoading.set(true);
      this.geoError.set(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation.set({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          this.isGeoLoading.set(false);

          // Auto-select the nearest clinic in the Working Time Card widget
          const nearest = this.filteredLocations()[0];
          if (nearest) {
            this.selectedLocationId.set(nearest.id);
          }
        },
        (error) => {
          console.warn('Geolocation access denied or timed out:', error);
          this.isGeoLoading.set(false);
          this.userLocation.set(null);
          this.geoError.set('Location access is required to sort clinics by proximity.');

          // Auto-dismiss notification toast after 5 seconds
          setTimeout(() => {
            this.geoError.set(null);
          }, 5000);
        },
        { enableHighAccuracy: true, timeout: 5000 },
      );
    } else {
      console.warn('Geolocation not supported by this browser.');
    }
  }

  // Haversine great-circle distance algorithm in miles
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
