import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ selector: 'app-navigation-fixture', template: '<h1 id="faqs">FAQs</h1>' })
class NavigationFixture {}

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.setItem('lmd-cookie-consent', 'declined');

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: NavigationFixture },
          { path: 'for-patients', component: NavigationFixture },
        ]),
      ],
    }).compileComponents();
  });

  afterEach(() => {
    window.localStorage.removeItem('lmd-cookie-consent');
  });

  it('should create the app', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('preserves query parameters and fragments through navigation in the real app shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const target = '/for-patients?source=email&topic=billing#faqs';
    expect(await router.navigateByUrl(target)).toBe(true);
    await fixture.whenStable();
    expect(router.url).toBe(target);
    expect(router.parseUrl(router.url).fragment).toBe('faqs');
  });

  it('should render the persistent site shell', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('app-header')).not.toBeNull();
    expect(element.querySelector('main.main-layout router-outlet')).not.toBeNull();
    expect(element.querySelector('app-footer')).not.toBeNull();
    expect(element.querySelector('app-cookie-consent')).not.toBeNull();
  });
});
