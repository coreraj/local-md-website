import {
  Component,
  signal,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  ElementRef,
  viewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../components/icon/icon';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';
import { environment } from '../../../environments/environment';

interface ClinicLocation {
  id: string;
  name: string;
  state: 'Illinois' | 'Indiana';
  address: string;
  phone: string;
  lat: number;
  lng: number;
  description: string;
  serving: string;
  services: string;
  workingHours: string;
  distance?: number; // calculated in miles
  reserveUrl?: string; // clockwise booking URL
}

interface GoogleMapInstance {
  setCenter(latLng: { lat: number; lng: number } | null): void;
  setZoom(zoom: number): void;
}

interface GoogleMapsWindow extends Window {
  google?: {
    maps?: {
      Map?: new (el: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
      InfoWindow?: new (options: Record<string, unknown>) => {
        close(): void;
        open(map: unknown, marker: unknown): void;
      };
      importLibrary?: (library: string) => Promise<Record<string, unknown>>;
    };
  };
  initGoogleMapStatic?: () => void;
}

interface MapMarker {
  clinicId: string;
  marker: {
    map: unknown;
  };
}

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [CommonModule, IconComponent, HeroComponent],
  template: `
    <div class="locations-page">
      <!-- 1. Hero / Header Banner -->
      <app-hero
        headline="10 clinics. Open 7 days a week."
        i18n-headline="@@locations.headline"
        bodytext="Find your nearest Local MD across Illinois and Indiana. Reserve your spot online to skip the wait, or just walk in."
        i18n-bodytext="@@locations.bodytext"
        [backgroundImage]="'assets/lcations_hero.webp'"
      >
        <div class="hero-contact">
          <span class="contact-label" i18n="@@locations.contactLabel">Call for reservation:</span>
          <a href="tel:708-922-0911" class="contact-link">708-922-0911</a>
        </div>
      </app-hero>

      <!-- 2. Main interactive controls & map grid -->
      <section class="locations-container">
        <!-- Tab bar & Sort options -->
        <div class="controls-header">
          <div class="tab-filters">
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'all'"
              (click)="activeTab.set('all')"
              role="tab"
              i18n="@@locations.tabAll"
            >
              All (10)
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'illinois'"
              (click)="activeTab.set('illinois')"
              role="tab"
              i18n="@@locations.tabIllinois"
            >
              Illinois (7)
            </button>
            <button
              class="tab-btn"
              [class.active]="activeTab() === 'indiana'"
              (click)="activeTab.set('indiana')"
              role="tab"
              i18n="@@locations.tabIndiana"
            >
              Indiana (3)
            </button>
          </div>

          <!-- Proximity sort badge & button -->
          <div class="sort-controls">
            <button
              class="geo-sort-btn"
              (click)="requestUserLocation()"
              [class.has-location]="userLocation() !== null"
              [class.loading]="isGeoLoading()"
            >
              <app-icon name="sort" [size]="18"></app-icon>
              <span>
                @if (userLocation()) {
                  <span i18n="@@locations.sortedByProximity">Sorted by proximity</span>
                } @else {
                  <span i18n="@@locations.sortByProximity">Sort by proximity</span>
                }
              </span>
              @if (isGeoLoading()) {
                <span class="geo-spinner"></span>
              }
            </button>
          </div>
        </div>

        <!-- Layout for Tablet/Mobile: 2 Steps (List or Map) -->
        @if (isMobileTablet()) {
          <div class="view-switch-banner">
            @if (activeStep() === 'list') {
              <div class="banner-glass">
                <h3 i18n="@@locations.showMap">Show a map</h3>
                <p i18n="@@locations.seeAllLocationsText">View all clinic locations on the map</p>
                <button
                  class="primary-btn switch-view-btn"
                  (click)="activeStep.set('map')"
                  i18n="@@locations.switchToMapButton"
                >
                  SWITCH TO MAP
                </button>
              </div>
            }
            @if (activeStep() === 'map') {
              <button class="go-back-btn" (click)="activeStep.set('list')">
                <app-icon name="left" [size]="18" color="#FFFFFF"></app-icon>
                <span i18n="@@locations.goBackButton">GO BACK</span>
              </button>
            }
          </div>
        }

        <!-- Split Grid Workspace -->
        <div
          class="locations-grid-wrapper"
          [class.mobile-map-active]="activeStep() === 'map' && isMobileTablet()"
        >
          <!-- Column A: Clinic List (scrollable) -->
          <div
            class="clinic-list-column"
            [class.hide-mobile]="activeStep() === 'map' && isMobileTablet()"
          >
            <div class="list-scroll-pane">
              @for (clinic of filteredClinics(); track clinic.id) {
                <div
                  class="clinic-card"
                  [class.expanded]="expandedClinicId() === clinic.id"
                  [class.active-highlight]="selectedClinicId() === clinic.id"
                  [id]="'clinic-card-' + clinic.id"
                  (click)="selectClinic(clinic, $event)"
                  (keydown.enter)="selectClinic(clinic, $event)"
                  (keydown.space)="$event.preventDefault(); selectClinic(clinic, $event)"
                  role="button"
                  tabindex="0"
                >
                  <div class="card-header-row">
                    <div class="card-title-block">
                      <span class="state-badge" [class.in]="clinic.state === 'Indiana'">{{
                        clinic.state | uppercase
                      }}</span>
                      <h2 class="clinic-name">{{ clinic.name }}</h2>
                      <p class="clinic-address">{{ clinic.address }}</p>

                      <!-- Distance calculation label -->
                      @if (clinic.distance !== undefined) {
                        <p class="proximity-label">
                          <app-icon name="location" [size]="14" color="#365873"></app-icon>
                          <span>{{ clinic.distance | number: '1.2-2' }}</span>
                          <span i18n="@@locations.milesFromYou">miles from you</span>
                        </p>
                      }
                    </div>

                    <!-- Right buttons & collapse toggle -->
                    <div class="card-actions-block">
                      <div class="action-buttons-group">
                        <a
                          [href]="getDirectionsUrl(clinic)"
                          target="_blank"
                          class="direction-btn"
                          (click)="$event.stopPropagation()"
                          (keydown)="$event.stopPropagation()"
                          i18n="@@locations.getDirections"
                          >GET DIRECTIONS</a
                        >
                        <a
                          [href]="clinic.reserveUrl || '#'"
                          target="_blank"
                          class="spot-btn"
                          (click)="$event.stopPropagation()"
                          (keydown)="$event.stopPropagation()"
                          i18n="@@locations.saveMySpot"
                        >
                          SAVE MY SPOT
                        </a>
                      </div>
                      <button
                        class="expand-toggle"
                        (click)="$event.stopPropagation(); toggleExpand(clinic.id)"
                        (keydown)="$event.stopPropagation()"
                        [attr.aria-label]="
                          expandedClinicId() === clinic.id ? 'Collapse details' : 'Expand details'
                        "
                      >
                        <app-icon
                          [name]="expandedClinicId() === clinic.id ? 'up' : 'down'"
                          [size]="20"
                          color="#211E0D"
                        ></app-icon>
                      </button>
                    </div>
                  </div>

                  <!-- Expanded details panel with smooth CSS transition height -->
                  <div class="card-expanded-panel">
                    <hr class="card-divider" />

                    <p class="clinic-desc">{{ clinic.description }}</p>

                    <div class="detail-section">
                      <span class="detail-header" i18n="@@locations.servingLabel">SERVING</span>
                      <p class="detail-text bold">{{ clinic.serving }}</p>
                    </div>

                    <div class="detail-section">
                      <span class="detail-header" i18n="@@locations.servicesHereLabel"
                        >SERVICES HERE</span
                      >
                      <p class="detail-text services">{{ clinic.services }}</p>
                    </div>

                    <div class="detail-section">
                      <span class="detail-header" i18n="@@locations.workingHoursLabel"
                        >WORKING HOURS</span
                      >
                      <p class="detail-text bold working-hours">{{ clinic.workingHours }}</p>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-list-state">
                  <app-icon name="location" [size]="48" color="#D41F38"></app-icon>
                  <p i18n="@@locations.noClinicsMatch">
                    No clinics available matching this filter.
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Column B: Google Map Container -->
          <div
            class="clinic-map-column"
            [class.show-mobile]="activeStep() === 'map' && isMobileTablet()"
          >
            <div #mapViewport class="map-inner-wrapper">
              <!-- Real Google Map Viewport -->
              <div
                #mapContainer
                class="real-google-map-viewport"
                [class.hidden]="useFallbackMap()"
              ></div>

              <!-- High-Fidelity Gorgeous Simulated SVG Fallback Map -->
              @if (useFallbackMap()) {
                <div class="simulated-map-viewport">
                  <div class="simulated-svg-overlay">
                    <svg viewBox="0 0 800 600" width="100%" height="100%" class="state-outline-svg">
                      <!-- Clean minimal map boundaries of IL & IN region -->
                      <rect width="800" height="600" fill="#E9E9E9" rx="16" />
                      <!-- Water representation Lake Michigan -->
                      <path
                        d="M 520 0 C 520 60, 500 120, 560 140 C 600 150, 620 110, 620 0 Z"
                        fill="#D3E2F2"
                        opacity="0.85"
                      />

                      <!-- Illinois Outline (simplified) -->
                      <path
                        d="M 280 120 L 480 120 L 480 320 L 430 420 L 350 560 L 260 520 L 220 340 L 260 220 Z"
                        fill="#FDFDFD"
                        stroke="#8C8C8C"
                        stroke-width="1"
                      />
                      <!-- Indiana Outline (simplified) -->
                      <path
                        d="M 480 120 L 620 120 L 630 380 L 520 540 L 430 420 L 480 320 Z"
                        fill="#FDFDFD"
                        stroke="#8C8C8C"
                        stroke-width="1"
                      />

                      <text
                        x="350"
                        y="280"
                        fill="#CCCCCC"
                        font-size="28"
                        font-family="'Outfit', sans-serif"
                        font-weight="700"
                        letter-spacing="3"
                        i18n="@@locations.mapIllinois"
                      >
                        ILLINOIS
                      </text>
                      <text
                        x="540"
                        y="320"
                        fill="#CCCCCC"
                        font-size="28"
                        font-family="'Outfit', sans-serif"
                        font-weight="700"
                        letter-spacing="3"
                        transform="rotate(15 540 320)"
                        i18n="@@locations.mapIndiana"
                      >
                        INDIANA
                      </text>
                    </svg>

                    <!-- Clinic location pins -->
                    @for (clinic of filteredClinics(); track clinic.id) {
                      <div
                        class="fallback-marker"
                        [style.left.%]="getSimulatedLeft(clinic)"
                        [style.top.%]="getSimulatedTop(clinic)"
                        (click)="selectClinic(clinic)"
                        (keydown.enter)="selectClinic(clinic)"
                        (keydown.space)="$event.preventDefault(); selectClinic(clinic)"
                        [attr.aria-label]="'View ' + clinic.name + ' clinic'"
                        role="button"
                        tabindex="0"
                      >
                        <!-- Highlight the selected clinic -->
                        <div
                          class="marker-ring"
                          [class.active]="selectedClinicId() === clinic.id"
                        ></div>
                        <div class="pin-dot"></div>
                      </div>
                    }

                    <!-- Custom Card overlay matching the selected pin -->
                    @if (getSelectedClinic(); as clinic) {
                      <div
                        class="custom-map-card"
                        [style.left.%]="getSimulatedLeft(clinic)"
                        [style.top.%]="getSimulatedTop(clinic)"
                      >
                        <button
                          class="close-card-btn"
                          (click)="selectedClinicId.set('')"
                          aria-label="Close clinic details"
                        >
                          ×
                        </button>
                        <h4 class="card-title">{{ clinic.name }}</h4>
                        <p class="clinic-address">{{ clinic.address }}</p>
                        <a
                          [href]="clinic.reserveUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="spot-btn"
                          i18n="@@locations.saveMySpot"
                          >SAVE MY SPOT</a
                        >
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- Geolocation Error Toast Notification -->
      @if (geoError()) {
        <div class="toast-notification">
          <app-icon name="sort" [size]="18" color="#D41F38"></app-icon>
          <span class="toast-message">{{ geoError() }}</span>
          <button class="toast-close-btn" (click)="geoError.set(null)" aria-label="Dismiss">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .locations-page {
        background-color: var(--white);
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow-x: hidden;
      }

      /* Beautiful Geolocation Error Toast Notification Styles */
      .toast-notification {
        position: fixed;
        bottom: 40px;
        right: 40px;
        background-color: #ffffff;
        border: 2px solid #d41f38;
        border-radius: 12px;
        padding: 14px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 30px rgba(212, 31, 56, 0.12);
        z-index: 10000;
        max-width: 420px;
        animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .toast-message {
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 600;
        color: #211e0d;
        line-height: 1.4;
      }

      .toast-close-btn {
        background: none;
        border: none;
        font-size: 22px;
        color: #8c8c8c;
        cursor: pointer;
        padding: 0;
        margin-left: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        transition:
          color 0.2s ease,
          transform 0.2s ease;
      }

      .toast-close-btn:hover {
        color: #211e0d;
        transform: scale(1.15);
      }

      @keyframes toastSlideIn {
        from {
          transform: translateY(24px) scale(0.95);
          opacity: 0;
        }
        to {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
      }

      /* 1. Hero Content Styles */

      .hero-contact {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 1.5rem;
        font-weight: 700;
        margin-top: 10px;
      }

      .contact-label {
        opacity: 0.9;
        font-size: 1.25rem;
        font-weight: 500;
      }

      .contact-link {
        color: var(--white);
        text-decoration: none;
        transition: transform 0.2s ease;
      }

      .contact-link:hover {
        transform: scale(1.03);
      }

      /* 2. Interactive grid controls */
      .locations-container {
        max-width: 1540px;
        margin: 0 auto;
        padding: 60px 24px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 32px;
      }

      .controls-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
      }

      .tab-filters {
        display: flex;
        gap: 12px;
      }

      .tab-btn {
        font-family: var(--font-body);
        font-weight: 600;
        font-size: 1rem;
        padding: 12px 24px;
        border-radius: 16px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: 2px solid var(--slate-blue);
        color: var(--slate-blue);
        background: transparent;
        transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .tab-btn:hover {
        background-color: rgba(54, 88, 115, 0.05);
        transform: translateY(-1px);
      }

      .tab-btn.active {
        background-color: var(--slate-blue);
        color: var(--white);
      }

      .geo-sort-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 24px;
        background-color: var(--light-gray);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        font-weight: 600;
        font-size: 1rem;
        color: var(--primary-charcoal);
        transition: transform 0.25s ease;
      }

      .geo-sort-btn:hover {
        background-color: var(--border-color);
        transform: translateY(-1px);
      }

      .geo-sort-btn.has-location {
        background-color: rgba(54, 88, 115, 0.1);
        border-color: var(--slate-blue);
        color: var(--slate-blue);
      }

      .geo-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--slate-blue);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 0.8s linear infinite;
        margin-left: 6px;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Responsive views switch banner for mobile/tablet */
      .view-switch-banner {
        width: 100%;
        margin-bottom: 8px;
      }

      .banner-glass {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(245, 245, 245, 0.5));
        backdrop-filter: blur(10px);
        border: 2px solid var(--border-color);
        border-radius: 20px;
        padding: 24px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      }

      .banner-glass h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--primary-charcoal);
      }

      .banner-glass p {
        color: var(--text-muted);
        font-size: 1.05rem;
      }

      .switch-view-btn {
        margin-top: 6px;
        font-weight: 700;
        border-radius: 16px;
        padding: 14px 28px;
        background-color: var(--slate-blue);
      }

      .switch-view-btn:hover {
        background-color: #2b455c;
      }

      .go-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background-color: var(--primary-charcoal);
        color: var(--white);
        padding: 12px 24px;
        border-radius: 16px;
        font-weight: 600;
        transition: transform 0.2s ease;
      }

      .go-back-btn:hover {
        transform: translateX(-2px);
      }

      /* 3. Grid split system */
      .locations-grid-wrapper {
        display: grid;
        grid-template-columns: 660px 1fr;
        gap: 24px;
        min-height: 800px;
        height: 1100px;
      }

      .clinic-list-column {
        height: 100%;
        overflow: hidden;
      }

      .list-scroll-pane {
        height: 100%;
        overflow-y: auto;
        padding-right: 12px;
        padding-top: 4px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      /* Custom scrollbar styling */
      .list-scroll-pane::-webkit-scrollbar {
        width: 8px;
      }
      .list-scroll-pane::-webkit-scrollbar-track {
        background: transparent;
      }
      .list-scroll-pane::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 10px;
      }
      .list-scroll-pane::-webkit-scrollbar-thumb:hover {
        background: var(--muted-gray);
      }

      /* Clinic Card UI styling */
      .clinic-card {
        background-color: var(--white);
        border: 2px solid #8c8c8c;
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        flex-shrink: 0;
        min-height: fit-content;
      }

      .clinic-card:hover {
        transform: translateY(-2px);
        border-color: var(--slate-blue);
        box-shadow: 0 10px 30px rgba(54, 88, 115, 0.08);
      }

      .clinic-card.active-highlight {
        border-color: var(--slate-blue);
        background-color: rgba(54, 88, 115, 0.02);
      }

      .card-header-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
        width: 100%;
      }

      .card-title-block {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        flex: 1;
      }

      .state-badge {
        font-family: var(--font-body);
        font-size: 18px;
        font-weight: 600;
        line-height: 25px;
        color: var(--accent-crimson);
      }

      .state-badge.in {
        color: var(--slate-blue);
      }

      .clinic-name {
        font-family: var(--font-body);
        font-size: 36px;
        font-weight: 600;
        color: #151515;
        line-height: 49px;
      }

      .clinic-address {
        font-family: var(--font-body);
        font-size: 24px;
        font-weight: 600;
        color: #5b5656;
        line-height: 33px;
      }

      .proximity-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--font-body);
        font-weight: 600;
        font-size: 24px;
        color: #365873;
        line-height: 33px;
        margin-top: 4px;
      }

      /* Card action button clusters */
      .card-actions-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
      }

      .action-buttons-group {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 198px;
      }

      .direction-btn,
      .spot-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 14px 24px;
        font-family: var(--font-body);
        font-weight: 700;
        font-size: 0.95rem;
        border-radius: 16px;
        text-align: center;
        text-decoration: none;
        transition:
          transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        text-transform: uppercase;
      }

      .direction-btn {
        background-color: transparent;
        border: 2px solid var(--border-color);
        color: var(--primary-charcoal);
      }

      .direction-btn:hover {
        background-color: var(--light-gray);
        border-color: var(--muted-gray);
      }

      .spot-btn {
        background-color: var(--primary-charcoal);
        color: var(--white);
        border: none;
      }

      .spot-btn:hover {
        background-color: #3b3724;
        box-shadow: 0 4px 12px rgba(33, 30, 13, 0.15);
      }

      .expand-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--light-gray);
        transition: background-color 0.2s ease;
        align-self: center;
        margin: 4px auto 0 auto;
      }

      .expand-toggle:hover {
        background-color: var(--border-color);
      }

      /* Collapsed Details Transition styling */
      .card-expanded-panel {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .clinic-card.expanded {
        grid-column: 1 / -1;
      }

      .clinic-card.expanded .card-expanded-panel {
        max-height: 800px;
        opacity: 1;
        margin-top: 24px;
      }

      .card-divider {
        border: 0;
        height: 1px;
        background-color: var(--border-color);
        margin-bottom: 24px;
      }

      .clinic-desc {
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 22px;
        color: #211e0d;
        font-weight: 500;
        margin-bottom: 24px;
      }

      .detail-section {
        margin-bottom: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .detail-header {
        font-family: var(--font-body);
        font-size: 18px;
        font-weight: 600;
        line-height: 25px;
        color: var(--accent-crimson);
      }

      .detail-text {
        font-family: var(--font-body);
        font-size: 18px;
        line-height: 25px;
        color: #211e0d;
        font-weight: 600;
      }

      .detail-text.bold {
        font-weight: 700;
        font-size: 16px;
        line-height: 22px;
      }

      .detail-text.services {
        font-weight: 600;
      }

      .detail-text.working-hours {
        white-space: pre-line;
      }

      /* Empty states */
      .empty-list-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 24px;
        text-align: center;
        gap: 16px;
        background-color: var(--light-gray);
        border-radius: 20px;
        color: var(--text-muted);
        font-size: 1.15rem;
        font-weight: 600;
      }

      /* Column B: Map Layout */
      .clinic-map-column {
        height: 100%;
        min-height: 500px;
      }

      .map-inner-wrapper {
        position: sticky;
        top: 40px;
        width: 100%;
        height: 100%;
        background-color: #e9e9e9;
        border: 2px solid var(--border-color);
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
      }

      .real-google-map-viewport {
        width: 100%;
        height: 100%;
      }

      .real-google-map-viewport.hidden {
        display: none;
      }

      /* 4. Fallback Simulated SVG Map styles */
      .simulated-map-viewport {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .simulated-svg-overlay {
        position: relative;
        width: 100%;
        height: 100%;
      }

      .state-outline-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Custom pins & markers */
      .fallback-marker {
        position: absolute;
        width: 48px;
        height: 48px;
        transform: translate(-50%, -50%);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }

      .fallback-marker:hover {
        transform: translate(-50%, -50%) scale(1.2);
        z-index: 20;
      }

      /* Highlight the selected clinic marker */
      .marker-ring {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: rgba(54, 88, 115, 0.15);
        border: 2px solid transparent;
        transition: all 0.3s ease;
      }

      .marker-ring.active {
        border-color: var(--primary-charcoal);
        transform: scale(1.1);
        animation: pulse-active 1.5s infinite;
      }

      @keyframes pulse-active {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.6;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .pin-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background-color: var(--slate-blue);
        border: 2px solid var(--white);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        z-index: 2;
      }

      /* Interactive Pin Custom Infobox popup card overlays */
      .custom-map-card {
        position: absolute;
        transform: translate(-50%, -115%);
        background-color: var(--white);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        border-radius: 16px;
        padding: 20px;
        width: 228px;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 10px;
        animation: card-appear 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes card-appear {
        from {
          opacity: 0;
          transform: translate(-50%, -105%) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translate(-50%, -115%) scale(1);
        }
      }

      /* Speech bubble pointer notch */
      .custom-map-card::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%) rotate(45deg);
        width: 16px;
        height: 16px;
        background-color: var(--white);
        border-right: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
      }

      .close-card-btn {
        position: absolute;
        top: 10px;
        right: 12px;
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-muted);
        line-height: 1;
      }

      .custom-map-card .card-title {
        font-family: var(--font-heading);
        font-size: 1.45rem;
        font-weight: 700;
        color: var(--primary-charcoal);
        line-height: 1.2;
      }

      /* 5. Responsive / Tablet & Mobile Media Queries */
      @media (max-width: 1200px) {
        .locations-grid-wrapper {
          grid-template-columns: 1fr;
          height: auto;
          min-height: unset;
        }

        .clinic-list-column {
          height: auto;
        }

        .list-scroll-pane {
          overflow-y: visible;
          padding-right: 0;
          height: auto;
        }

        /* 2-Step Tablet transition switches */
        .locations-grid-wrapper.mobile-map-active {
          height: 700px;
        }

        .hide-mobile {
          display: none !important;
        }

        .show-mobile {
          display: block !important;
          height: 100% !important;
        }

        .clinic-map-column {
          display: none;
        }

        .clinic-map-column.show-mobile {
          display: block;
        }

        .map-inner-wrapper {
          position: relative;
          top: 0;
          height: 600px;
        }
      }

      @media (max-width: 768px) {
        .hero-contact {
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          font-size: 1.25rem;
        }

        .tab-filters {
          width: 100%;
          flex-direction: column;
        }

        .tab-btn {
          width: 100%;
          text-align: center;
        }

        .list-scroll-pane {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .clinic-card {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          gap: 12px;
          background: #ffffff;
          border: 2px solid #8c8c8c;
          border-radius: 8px;
          height: 100%;
        }

        .card-header-row {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          width: 100%;
          height: 100%;
          flex: 1;
        }

        .card-title-block {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          width: 100%;
          margin-bottom: auto;
        }

        .state-badge {
          font-family: 'Tirra', var(--font-body);
          font-size: 14px;
          line-height: 19px;
          font-weight: 600;
          color: #d41f38;
          text-transform: uppercase;
        }

        .state-badge.in {
          color: #365873;
        }

        .clinic-name {
          font-family: 'Tirra', var(--font-body);
          font-size: 18px;
          line-height: 25px;
          font-weight: 600;
          color: #323232;
        }

        .clinic-address {
          font-family: 'Tirra', var(--font-body);
          font-size: 14px;
          line-height: 19px;
          font-weight: 600;
          color: #5b5656;
        }

        .proximity-label {
          font-family: 'Tirra', var(--font-body);
          font-size: 14px;
          line-height: 19px;
          font-weight: 600;
        }

        .card-actions-block {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: auto;
        }

        .action-buttons-group {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .direction-btn,
        .spot-btn {
          height: 40px;
          padding: 10px 12px;
          font-family: 'Tirra', var(--font-body);
          font-weight: 600;
          font-size: 12px;
          line-height: 16px;
          border-radius: 9999px;
          text-align: center;
          text-transform: uppercase;
          justify-content: center;
          width: 100%;
        }

        .expand-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--light-gray);
          align-self: center;
          margin: 4px auto 0 auto;
        }

        .locations-container {
          padding: 30px 16px;
        }
      }
    `,
  ],
})
export class LocationsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);

  // Element handle for the real Google Maps container
  private readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');
  private readonly mapViewport = viewChild<ElementRef<HTMLDivElement>>('mapViewport');
  private mapVisibilityObserver?: IntersectionObserver;
  private googleMapsLoadStarted = false;
  private readonly resizeListener = () => this.checkViewport();

  // Keep shared clinic details in sync with src/app/pages/home/home.ts when editing this list.
  private readonly rawClinics = signal<ClinicLocation[]>([
    {
      id: 'columbus',
      name: 'Columbus',
      state: 'Indiana',
      address: '3019 N National Rd, Columbus, IN 47203',
      phone: '708-922-0911',
      lat: 39.2272,
      lng: -85.8972,
      description:
        'Your neighborhood destination for affordable school sports physicals, occupational injuries, and advanced molecular panels in Columbus.',
      serving: 'Columbus, Taylorsville, and Bartholomew County.',
      services: 'Urgent care · Primary care · Lab & diagnostics · Physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/14687',
    },
    {
      id: 'decatur',
      name: 'Decatur',
      state: 'Illinois',
      address: '4195 N Water St, Decatur, IL 62526',
      phone: '708-922-0911',
      lat: 39.8856,
      lng: -88.9515,
      description:
        'Spacious walk-in clinic in Decatur fully equipped with digital X-Ray imaging, advanced rapid testing kits, and comprehensive primary care solutions.',
      serving: 'Decatur, Forsyth, Harristown, and Macon County.',
      services: 'Urgent care · Digital X-ray · Lab diagnostics · Occupational health',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/14690',
    },
    {
      id: 'homewood',
      name: 'Homewood',
      state: 'Illinois',
      address: '17960 South Halsted Street, Homewood, Illinois, United States 60430',
      phone: '708-922-0911',
      lat: 41.5645,
      lng: -87.6405,
      description:
        'Expert medical diagnosis, ongoing physical management, and rapid laboratory diagnostics directly on the Halsted Street corridor in Homewood.',
      serving: 'Homewood, Flossmoor, Glenwood, and South Suburbs.',
      services: 'Urgent care · Primary care · Lab diagnostics · DOT physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/15569',
    },
    {
      id: 'martinsville',
      name: 'Martinsville',
      state: 'Indiana',
      address: '630 Birk Rd, Martinsville, IN 46151',
      phone: '708-922-0911',
      lat: 39.4125,
      lng: -86.4178,
      description:
        'Providing pristine family-oriented medical attention, primary care scheduling, and extensive lab setups for the Martinsville community.',
      serving: 'Martinsville, Brooklyn, Centerton, and Morgan County.',
      services: 'Urgent care · Primary care · Lab diagnostics · Physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/14691',
    },
    {
      id: 'melrose-park',
      name: 'Melrose Park',
      state: 'Illinois',
      address: '600 W North Ave, Melrose Park, IL 60160',
      phone: '708-922-0911',
      lat: 41.9095,
      lng: -87.8715,
      description:
        'Walk-in urgent care and state-of-the-art diagnostic screening available on North Avenue with no appointments needed.',
      serving: 'Melrose Park, Maywood, Stone Park, and West Suburbs.',
      services: 'Urgent care · Lab & diagnostics · Primary care · DME · Occupational health',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/14692',
    },
    {
      id: 'norridge',
      name: 'Norridge',
      state: 'Illinois',
      address: '4460 N. Harlem, Norridge, IL 60706',
      phone: '708-922-0911',
      lat: 41.9602,
      lng: -87.8071,
      description:
        'Local MD Urgent Care in Norridge brings walk-in urgent care, primary care, and our own state-of-the-art laboratory to the Harlem Avenue corridor.',
      serving: 'Norridge, Harwood Heights, and the surrounding Northwest Side communities.',
      services: 'Urgent care · Primary care · Lab & diagnostics · X-ray · Physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/16681',
    },
    {
      id: 'palatine',
      name: 'Palatine',
      state: 'Illinois',
      address: '770 E Dundee Rd, Palatine, IL 60074',
      phone: '708-922-0911',
      lat: 42.1395,
      lng: -88.0245,
      description:
        'Our Palatine clinic provides extensive medical consultations, rapid flu/strep screening, and walk-in injury splintings on Dundee Road.',
      serving: 'Palatine, Arlington Heights, Rolling Meadows, and Northwest Suburbs.',
      services: 'Urgent care · In-house diagnostics · DME · X-ray',
      workingHours: 'Mon-Fri: 9:00a-7:00p\nSat-Sun: 9:00a-2:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/18713',
    },
    {
      id: 'pullman',
      name: 'Pullman',
      state: 'Illinois',
      address: '10834 South Doty Avenue, Chicago, Illinois, United States 60628',
      phone: '708-922-0911',
      lat: 41.6923,
      lng: -87.5997,
      description:
        "Serving Chicago's historic Pullman and Roseland communities, our modern facility offers comprehensive occupational health, prompt injury care, and fast laboratory diagnostics.",
      serving: 'Pullman, Roseland, West Pullman, and the far South Side of Chicago.',
      services:
        'Urgent care · Occupational health · Lab & diagnostics · Primary care · Physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/15570',
    },
    {
      id: 'warsaw',
      name: 'Warsaw',
      state: 'Indiana',
      address: '2680 Escalade Way, Warsaw, IN 46582',
      phone: '708-922-0911',
      lat: 41.2381,
      lng: -85.8569,
      description:
        'Expert medical diagnosis, quick walk-in splinting, and rapid laboratory results for the Warsaw and Kosciusko County community.',
      serving: 'Warsaw, Winona Lake, and Kosciusko County.',
      services: 'Urgent care · Primary care · Lab diagnostics · DOT physicals · DME',
      workingHours: 'Mon-Fri: 8:00a-8:00p\nSat-Sun: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/16682',
    },
    {
      id: 'zion',
      name: 'Zion',
      state: 'Illinois',
      address: '2015 Sheridan Rd, Zion, IL 60099',
      phone: '708-922-0911',
      lat: 42.4455,
      lng: -87.8431,
      description:
        'Convenient walk-in urgent care and direct access to state-of-the-art diagnostic screening on Sheridan Road for Zion, Winthrop Harbor, and Beach Park.',
      serving: 'Zion, Winthrop Harbor, Beach Park, and Lake County.',
      services: 'Urgent care · Primary care · In-house diagnostics · DME · Immunizations',
      workingHours: 'Mon-Fri: 9:00a-5:00p',
      reserveUrl: 'https://www.clockwisemd.com/visit/14693',
    },
  ]);

  // Reactive state signals
  protected readonly activeTab = signal<'all' | 'illinois' | 'indiana'>('all');
  protected readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  protected readonly isGeoLoading = signal<boolean>(false);
  protected readonly geoError = signal<string | null>(null);
  protected readonly expandedClinicId = signal<string>('');
  protected readonly selectedClinicId = signal<string>('');
  protected readonly activeStep = signal<'list' | 'map'>('list');
  protected readonly isMobileTablet = signal<boolean>(false);
  protected readonly useFallbackMap = signal<boolean>(true); // defaults to true unless Google API loads successfully

  private googleMap: GoogleMapInstance | null = null;
  private mapMarkers: MapMarker[] = [];
  private activeInfoWindow: { close(): void; open(map: unknown, marker: unknown): void } | null =
    null;

  // Compute filtered clinics based on current state & tab selection, sorted by distance if user location is available
  protected readonly filteredClinics = computed<ClinicLocation[]>(() => {
    let clinics = this.rawClinics();
    const tab = this.activeTab();

    // 1. Filter by State
    if (tab === 'illinois') {
      clinics = clinics.filter((c) => c.state === 'Illinois');
    } else if (tab === 'indiana') {
      clinics = clinics.filter((c) => c.state === 'Indiana');
    }

    // 2. Add Distance if User Location is active
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

  constructor() {
    inject(SeoService).setMetadata({
      title: 'Our Clinic Locations & Walk-In Centers',
      description:
        'Find a Local MD clinic near you. View addresses, contact numbers, hours of operation, and get directions to our walk-in healthcare centers.',
      image: '/assets/lcations_hero.webp',
      path: '/locations',
    });

    // Setup reactive side-effects to auto-update real Google Map markers if visible
    effect(() => {
      const clinics = this.filteredClinics();
      const fallback = this.useFallbackMap();
      if (!fallback && isPlatformBrowser(this.platformId)) {
        this.updateGoogleMapMarkers(clinics);
      }
    });

    // Setup viewport listener
    if (isPlatformBrowser(this.platformId)) {
      this.checkViewport();
      window.addEventListener('resize', this.resizeListener, { passive: true });
    }
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Check if a specific clinic needs to be selected/focused via query parameters
      this.route.queryParams.subscribe((params) => {
        const selectId = params['select'];
        if (selectId) {
          const targetClinic = this.rawClinics().find((c) => c.id === selectId);
          if (targetClinic) {
            // Adjust active tab state depending on target clinic's state
            if (targetClinic.state === 'Illinois') {
              this.activeTab.set('illinois');
            } else if (targetClinic.state === 'Indiana') {
              this.activeTab.set('indiana');
            }

            // Mark as selected & expanded
            this.selectClinic(targetClinic);

            // Smooth scroll to the target clinic card
            setTimeout(() => {
              const el = document.getElementById(`clinic-card-${targetClinic.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }, 350);
          }
        }
      });
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const viewport = this.mapViewport()?.nativeElement;
    if (!viewport || !('IntersectionObserver' in window)) {
      this.loadGoogleMapsApi();
      return;
    }

    this.mapVisibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.mapVisibilityObserver?.disconnect();
          this.mapVisibilityObserver = undefined;
          this.loadGoogleMapsApi();
        }
      },
      { rootMargin: '300px 0px' },
    );
    this.mapVisibilityObserver.observe(viewport);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.mapVisibilityObserver?.disconnect();
    window.removeEventListener('resize', this.resizeListener);
    (window as unknown as GoogleMapsWindow).initGoogleMapStatic = () => undefined;
  }

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

          // Re-center Google Map around user location if available
          if (this.googleMap) {
            this.googleMap.setCenter(this.userLocation());
            this.googleMap.setZoom(9);
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

  // Helper calculation for simulated SVG map scaling
  protected getSimulatedLeft(clinic: ClinicLocation): number {
    // Include every clinic instead of clamping outlying locations to the same edge.
    const longitudes = this.rawClinics().map((location) => location.lng);
    const minLng = Math.min(...longitudes);
    const range = Math.max(...longitudes) - minLng || 1;
    return 8 + ((clinic.lng - minLng) / range) * 84;
  }

  protected getSimulatedTop(clinic: ClinicLocation): number {
    const latitudes = this.rawClinics().map((location) => location.lat);
    const maxLat = Math.max(...latitudes);
    const range = maxLat - Math.min(...latitudes) || 1;
    return 8 + ((maxLat - clinic.lat) / range) * 84;
  }

  protected getSelectedClinic(): ClinicLocation | undefined {
    return this.rawClinics().find((c) => c.id === this.selectedClinicId());
  }

  // Handle active selected clinic click
  protected selectClinic(clinic: ClinicLocation, event?: Event): void {
    this.selectedClinicId.set(clinic.id);
    this.expandedClinicId.set(clinic.id);

    // If Google Map is initialized, center it around the selected clinic coordinates and zoom in
    if (this.googleMap) {
      this.googleMap.setCenter({ lat: clinic.lat, lng: clinic.lng });
      this.googleMap.setZoom(12);
    }

    // If real Google Map is active, open the info window
    if (this.googleMap && !this.useFallbackMap()) {
      const markerObj = this.mapMarkers.find((m) => m.clinicId === clinic.id);
      if (markerObj) {
        this.openInfoWindow(markerObj.marker, clinic);
      }
    }

    // Scroll card into view smoothly on desktop if selected from map
    if (!event && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const el = document.getElementById(`clinic-card-${clinic.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }

  protected toggleExpand(id: string): void {
    if (this.expandedClinicId() === id) {
      this.expandedClinicId.set('');
    } else {
      this.expandedClinicId.set(id);
    }
  }

  protected getDirectionsUrl(clinic: ClinicLocation): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}`;
  }

  private checkViewport(): void {
    this.isMobileTablet.set(window.innerWidth <= 1100);
  }

  // Load Google Maps script dynamically
  private loadGoogleMapsApi(): void {
    if (this.googleMapsLoadStarted) return;
    this.googleMapsLoadStarted = true;

    // An empty key intentionally keeps the fallback map without contacting Google.
    if (!environment.googleMapsApiKey.trim()) return;

    // Check if google maps script is already on page
    const win = window as unknown as GoogleMapsWindow;
    if (typeof window !== 'undefined' && win.google && win.google.maps) {
      this.initGoogleMap();
      return;
    }

    // Attempt to load Google Maps; the fallback stays active if the script fails.
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&callback=initGoogleMapStatic&loading=async`;
    script.async = true;
    script.defer = true;

    // Attach global callback
    win.initGoogleMapStatic = () => {
      this.initGoogleMap();
    };

    script.onerror = () => {
      console.warn('Google Maps API failed to load. Falling back to Simulated Map.');
      this.useFallbackMap.set(true);
    };

    document.head.appendChild(script);

    // Safety timeout: If callback hasn't fired in 4 seconds, verify fallback is fully active
    setTimeout(() => {
      if (this.useFallbackMap() && !this.googleMap) {
        this.useFallbackMap.set(true);
      }
    }, 4000);
  }

  private initGoogleMap(): void {
    const el = this.mapContainer()?.nativeElement;
    if (!el || !isPlatformBrowser(this.platformId)) return;

    try {
      const chicagoCenter = { lat: 41.8781, lng: -87.6298 };

      // Initialize Map
      const win = window as unknown as GoogleMapsWindow;
      if (win.google?.maps?.Map) {
        this.googleMap = new win.google.maps.Map(el, {
          center: chicagoCenter,
          zoom: 9,
          styles: this.getPremiumMapStyles(),
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
        });
      }

      this.useFallbackMap.set(false);
      this.updateGoogleMapMarkers(this.filteredClinics());
    } catch (err) {
      console.warn('Error constructing Google Map object:', err);
      this.useFallbackMap.set(true);
    }
  }

  private async updateGoogleMapMarkers(clinics: ClinicLocation[]): Promise<void> {
    if (!this.googleMap) return;

    // Clear existing markers
    this.mapMarkers.forEach((m) => {
      const markerEl = m.marker as Record<string, unknown>;
      markerEl['map'] = null;
    });
    this.mapMarkers = [];

    try {
      const win = window as unknown as GoogleMapsWindow;
      if (!win.google?.maps?.importLibrary) return;

      const markerLib = (await win.google.maps.importLibrary('marker')) as Record<
        string,
        new (options: Record<string, unknown>) => {
          map: unknown;
          addListener(event: string, cb: () => void): void;
        }
      >;
      const AdvancedMarkerElement = markerLib['AdvancedMarkerElement'];
      const PinElement = markerLib['PinElement'];

      clinics.forEach((clinic) => {
        const pin = new PinElement({
          background: '#365873',
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          scale: 0.8,
        });

        const marker = new AdvancedMarkerElement({
          position: { lat: clinic.lat, lng: clinic.lng },
          map: this.googleMap,
          title: clinic.name,
          content: pin,
        });

        // Attach click handlers
        marker.addListener('gmp-click', () => {
          this.selectClinic(clinic);
        });

        this.mapMarkers.push({ clinicId: clinic.id, marker: marker as { map: unknown } });
      });
    } catch (err) {
      console.warn('Error creating advanced markers:', err);
    }
  }

  private openInfoWindow(marker: unknown, clinic: ClinicLocation): void {
    if (this.activeInfoWindow) {
      this.activeInfoWindow.close();
    }

    // Premium custom styled info card HTML for maps overlay
    const contentString = `
      <div style="font-family: 'Inter', sans-serif; padding: 12px; max-width: 220px; color: #211E0D;">
        <h3 style="font-family: 'Outfit', sans-serif; font-size: 1.3rem; margin: 0 0 6px 0; font-weight: 700;">${clinic.name}</h3>
        <p style="font-size: 0.95rem; margin: 0 0 10px 0; color: #5B5656; font-weight: 600;">${clinic.address}</p>
        <a href="${clinic.reserveUrl}" target="_blank" rel="noopener noreferrer" style="color: #365873; font-weight: 700;">SAVE MY SPOT</a>
      </div>
    `;

    const win = window as unknown as GoogleMapsWindow;
    if (win.google?.maps?.InfoWindow) {
      this.activeInfoWindow = new win.google.maps.InfoWindow({
        content: contentString,
      }) as { close(): void; open(map: unknown, marker: unknown): void };

      this.activeInfoWindow.open(this.googleMap, marker);
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

  // Curated Sleek Minimalist Map Theme Styles (Silver theme)
  private getPremiumMapStyles(): Record<string, unknown>[] {
    return [
      { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
      { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
      {
        featureType: 'administrative.land_parcel',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#bdbdbd' }],
      },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
      { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      {
        featureType: 'road.arterial',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#757575' }],
      },
      { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#616161' }],
      },
      {
        featureType: 'road.local',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9e9e9e' }],
      },
      { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
      { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
      { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
    ];
  }
}
