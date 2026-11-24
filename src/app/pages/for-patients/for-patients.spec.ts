import { ViewportScroller } from '@angular/common';
import { DeferBlockBehavior, DeferBlockState, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { ForPatientsComponent } from './for-patients';

describe('Patient resources navigation', () => {
  afterEach(() => vi.restoreAllMocks());

  function configure() {
    TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [provideRouter([{ path: 'for-patients', component: ForPatientsComponent }])],
    });
  }

  it('points results, payment, and reservation shortcuts at existing destinations', async () => {
    configure();
    const harness = await RouterTestingHarness.create('/for-patients');
    await harness.fixture.whenStable();
    const links = harness.routeNativeElement?.querySelectorAll<HTMLAnchorElement>('.shortcut-card');
    expect(links?.[0].getAttribute('href')).toBe(environment.links.testResults);
    expect(links?.[1].getAttribute('href')).toBe(environment.links.payBill);
    expect(links?.[2].getAttribute('href')).toBe('/locations?intent=nearest');
  });

  it('positions a FAQ deep link after both deferred sections have rendered', async () => {
    configure();
    const scroll = vi
      .spyOn(TestBed.inject(ViewportScroller), 'scrollToAnchor')
      .mockImplementation(() => undefined);
    const harness = await RouterTestingHarness.create('/for-patients#faqs');
    const blocks = await harness.fixture.getDeferBlocks();
    expect(blocks).toHaveLength(2);
    await blocks[1].render(DeferBlockState.Complete);
    await harness.fixture.whenStable();
    expect(scroll).not.toHaveBeenCalled();
    await blocks[0].render(DeferBlockState.Complete);
    await harness.fixture.whenStable();
    expect(scroll).toHaveBeenCalledWith('faqs', { behavior: 'instant' });
    expect(harness.routeNativeElement?.querySelector('#faqs')?.getAttribute('tabindex')).toBe('-1');
  });
});
