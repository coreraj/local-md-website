import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { calculateDistanceMiles, LocationsComponent } from './locations';

const leafletMocks = vi.hoisted(() => {
  const mapInstance = {
    fitBounds: vi.fn(),
    invalidateSize: vi.fn(),
    setView: vi.fn(),
    closePopup: vi.fn(),
    remove: vi.fn(),
  };
  const layerInstance = {
    addTo: vi.fn(),
    clearLayers: vi.fn(),
  };
  layerInstance.addTo.mockReturnValue(layerInstance);

  const markers: {
    bindPopup: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    addTo: ReturnType<typeof vi.fn>;
    openPopup: ReturnType<typeof vi.fn>;
    setIcon: ReturnType<typeof vi.fn>;
    click?: () => void;
  }[] = [];

  const marker = vi.fn(() => {
    const instance = {
      bindPopup: vi.fn(),
      on: vi.fn(),
      addTo: vi.fn(),
      openPopup: vi.fn(),
      setIcon: vi.fn(),
      click: undefined as (() => void) | undefined,
    };
    instance.bindPopup.mockReturnValue(instance);
    instance.addTo.mockReturnValue(instance);
    instance.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'click') instance.click = callback;
      return instance;
    });
    markers.push(instance);
    return instance;
  });

  const tileLayerInstance = { on: vi.fn(), addTo: vi.fn() };
  tileLayerInstance.on.mockReturnValue(tileLayerInstance);
  tileLayerInstance.addTo.mockReturnValue(tileLayerInstance);

  return {
    map: vi.fn(() => mapInstance),
    mapInstance,
    layerGroup: vi.fn(() => layerInstance),
    layerInstance,
    marker,
    markers,
    divIcon: vi.fn((options) => options),
    latLngBounds: vi.fn((coordinates) => ({ coordinates })),
    tileLayer: vi.fn(() => tileLayerInstance),
    tileLayerInstance,
  };
});

vi.mock('leaflet', () => {
  const leaflet = {
    map: leafletMocks.map,
    layerGroup: leafletMocks.layerGroup,
    marker: leafletMocks.marker,
    divIcon: leafletMocks.divIcon,
    latLngBounds: leafletMocks.latLngBounds,
    tileLayer: leafletMocks.tileLayer,
  };

  return { ...leaflet, default: leaflet };
});

type QueryParams = Record<string, string>;

describe('LocationsComponent', () => {
  let queryParams: BehaviorSubject<QueryParams>;
  let router: { navigate: ReturnType<typeof vi.fn> };
  let geolocation: { getCurrentPosition: ReturnType<typeof vi.fn> };

  const expectedBookings: Record<string, string> = {
    Columbus: 'https://www.clockwisemd.com/visit/14687',
    Decatur: 'https://www.clockwisemd.com/visit/14690',
    Homewood: 'https://www.clockwisemd.com/visit/15569',
    Martinsville: 'https://www.clockwisemd.com/visit/14691',
    'Melrose Park': 'https://www.clockwisemd.com/visit/14692',
    Norridge: 'https://www.clockwisemd.com/visit/16681',
    Palatine: 'https://www.clockwisemd.com/visit/18713',
    Pullman: 'https://www.clockwisemd.com/visit/15570',
    Warsaw: 'https://www.clockwisemd.com/visit/16682',
    Zion: 'https://www.clockwisemd.com/visit/14693',
  };

  async function createComponent(platformId = 'browser') {
    await TestBed.configureTestingModule({
      imports: [LocationsComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams.asObservable() } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LocationsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    await vi.dynamicImportSettled();
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    queryParams = new BehaviorSubject<QueryParams>({});
    router = { navigate: vi.fn().mockResolvedValue(true) };
    geolocation = { getCurrentPosition: vi.fn() };
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 });
    Object.defineProperty(window, 'IntersectionObserver', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, 'ResizeObserver', { configurable: true, value: undefined });
    leafletMocks.map.mockClear();
    leafletMocks.map.mockImplementation(() => leafletMocks.mapInstance);
    leafletMocks.mapInstance.fitBounds.mockClear();
    leafletMocks.mapInstance.invalidateSize.mockClear();
    leafletMocks.mapInstance.setView.mockClear();
    leafletMocks.mapInstance.closePopup.mockClear();
    leafletMocks.mapInstance.remove.mockClear();
    leafletMocks.layerInstance.clearLayers.mockClear();
    leafletMocks.marker.mockClear();
    leafletMocks.markers.length = 0;
    leafletMocks.tileLayerInstance.on.mockClear();
    leafletMocks.tileLayerInstance.addTo.mockClear();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders all ten clinics and the exact ClockwiseMD booking URLs', async () => {
    const fixture = await createComponent();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
      '.clinic-card',
    );
    expect(cards).toHaveLength(10);
    for (const card of cards) {
      const name = card.querySelector('.clinic-name')?.textContent?.trim() ?? '';
      const link = card.querySelector<HTMLAnchorElement>('.spot-btn');
      expect(link?.href).toBe(expectedBookings[name]);
      expect(link?.rel).toContain('noopener');
      expect(link?.rel).toContain('noreferrer');
    }
  });

  it('filters seven Illinois and three Indiana clinics with matching markers', async () => {
    const fixture = await createComponent();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.tab-btn',
    );

    leafletMocks.marker.mockClear();
    tabs[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.clinic-card')).toHaveLength(7);
    expect(leafletMocks.marker).toHaveBeenCalledTimes(7);

    leafletMocks.marker.mockClear();
    tabs[2].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('.clinic-card')).toHaveLength(3);
    expect(leafletMocks.marker).toHaveBeenCalledTimes(3);
  });

  it('calculates known nearest clinics, including exact zero distance', () => {
    expect(calculateDistanceMiles(39.2272, -85.8972, 39.2272, -85.8972)).toBe(0);
    const homewoodToHomewood = calculateDistanceMiles(41.5645, -87.6405, 41.5645, -87.6405);
    const homewoodToZion = calculateDistanceMiles(41.5645, -87.6405, 42.4455, -87.8431);
    expect(homewoodToHomewood).toBe(0);
    expect(homewoodToZion).toBeGreaterThan(50);
  });

  it('rejects invalid and non-finite coordinates', () => {
    expect(calculateDistanceMiles(Number.NaN, 0, 0, 0)).toBeNull();
    expect(calculateDistanceMiles(91, 0, 0, 0)).toBeNull();
    expect(calculateDistanceMiles(0, 181, 0, 0)).toBeNull();
    expect(calculateDistanceMiles(0, 0, Number.POSITIVE_INFINITY, 0)).toBeNull();
  });

  it.each([
    [{ latitude: 39.2272, longitude: -85.8972 }, 'Columbus'],
    [{ latitude: 41.5645, longitude: -87.6405 }, 'Homewood'],
    [{ latitude: 41.2381, longitude: -85.8569 }, 'Warsaw'],
    [{ latitude: 42.4455, longitude: -87.8431 }, 'Zion'],
  ])('selects the expected nearest clinic for %o', async (coords, clinicName) => {
    queryParams.next({ intent: 'nearest' });
    geolocation.getCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords } as GeolocationPosition),
    );
    const fixture = await createComponent();
    expect(
      fixture.nativeElement.querySelector('.clinic-card.active-highlight .clinic-name')
        ?.textContent,
    ).toContain(clinicName);
    expect(fixture.nativeElement.querySelector('.nearest-booking-panel')?.textContent).toContain(
      'approximate straight-line distance',
    );
  });

  it('does not request location during normal Locations navigation', async () => {
    await createComponent();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('handles permission denied without selecting a default clinic', async () => {
    queryParams.next({ intent: 'nearest' });
    geolocation.getCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 1 } as GeolocationPositionError),
    );
    const fixture = await createComponent();
    expect(fixture.nativeElement.querySelector('.clinic-card.active-highlight')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Choose a clinic to continue');
    expect(fixture.nativeElement.textContent).toContain('permission was denied');
  });

  it('handles location timeout and unsupported geolocation', async () => {
    geolocation.getCurrentPosition.mockImplementation(
      (_success: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 3 } as GeolocationPositionError),
    );
    const fixture = await createComponent();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.geo-sort-btn')
      ?.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('timed out');

    fixture.destroy();
    TestBed.resetTestingModule();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    const unsupported = await createComponent();
    (unsupported.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.geo-sort-btn')
      ?.click();
    unsupported.detectChanges();
    expect(unsupported.nativeElement.textContent).toContain('does not support location access');
  });

  it('preserves valid select query behavior and ignores an invalid clinic ID', async () => {
    queryParams.next({ select: 'warsaw', intent: 'nearest' });
    const fixture = await createComponent();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('.clinic-card.active-highlight .clinic-name')
        ?.textContent,
    ).toContain('Warsaw');

    queryParams.next({ select: 'not-a-clinic' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.clinic-card')).toHaveLength(3);
  });

  it('supports repeated booking intent actions after the intent is consumed', async () => {
    geolocation.getCurrentPosition.mockImplementation((success: PositionCallback) =>
      success({ coords: { latitude: 39.2272, longitude: -85.8972 } } as GeolocationPosition),
    );
    const fixture = await createComponent();
    queryParams.next({ intent: 'nearest' });
    fixture.detectChanges();
    queryParams.next({});
    queryParams.next({ intent: 'nearest' });
    fixture.detectChanges();
    expect(geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
  });

  it('synchronizes card and marker selection', async () => {
    const fixture = await createComponent();
    const homewoodCard = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.clinic-card'),
    ].find((card) => card.textContent?.includes('Homewood'));
    homewoodCard?.click();
    fixture.detectChanges();
    expect(homewoodCard?.classList.contains('active-highlight')).toBe(true);
    expect(leafletMocks.mapInstance.setView).toHaveBeenCalledWith([41.5645, -87.6405], 12);

    leafletMocks.markers[0].click?.();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.clinic-card.active-highlight .clinic-name')
        ?.textContent,
    ).toContain('Columbus');
  });

  it('shows a fallback if map initialization fails', async () => {
    leafletMocks.map.mockImplementationOnce(() => {
      throw new Error('map unavailable');
    });
    const fixture = await createComponent();
    expect(fixture.nativeElement.textContent).toContain('Interactive map unavailable');
    expect(fixture.nativeElement.textContent).toContain('schematic, not a geographical map');
    expect(fixture.nativeElement.querySelectorAll('.clinic-card')).toHaveLength(10);
  });

  it('shows a non-blocking warning when map tiles fail', async () => {
    let tileError: (() => void) | undefined;
    leafletMocks.tileLayerInstance.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'tileerror') tileError = callback;
      return leafletMocks.tileLayerInstance;
    });
    const fixture = await createComponent();
    tileError?.();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Map tiles are temporarily unavailable');
    expect(fixture.nativeElement.querySelectorAll('.clinic-card .spot-btn')).toHaveLength(10);
  });

  it('clears markers rather than duplicating them during repeated filter changes', async () => {
    const fixture = await createComponent();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      '.tab-btn',
    );
    leafletMocks.layerInstance.clearLayers.mockClear();
    tabs[1].click();
    fixture.detectChanges();
    tabs[0].click();
    fixture.detectChanges();
    tabs[2].click();
    fixture.detectChanges();
    expect(leafletMocks.layerInstance.clearLayers).toHaveBeenCalledTimes(3);
  });

  it('cleans up the map and ignores late geolocation callbacks on destruction', async () => {
    let successCallback: PositionCallback | undefined;
    geolocation.getCurrentPosition.mockImplementation((success: PositionCallback) => {
      successCallback = success;
    });
    const fixture = await createComponent();
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.geo-sort-btn')
      ?.click();
    fixture.destroy();
    successCallback?.({
      coords: { latitude: 42.4455, longitude: -87.8431 },
    } as GeolocationPosition);
    expect(leafletMocks.mapInstance.remove).toHaveBeenCalledTimes(1);
  });

  it('renders clinic content on the server without loading Leaflet or geolocation', async () => {
    const fixture = await createComponent('server');
    expect(fixture.nativeElement.querySelectorAll('.clinic-card')).toHaveLength(10);
    expect(leafletMocks.map).not.toHaveBeenCalled();
    expect(geolocation.getCurrentPosition).not.toHaveBeenCalled();
  });
});
