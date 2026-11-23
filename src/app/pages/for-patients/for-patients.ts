import { afterRenderEffect, Component, ElementRef, signal, inject, viewChild } from '@angular/core';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../components/icon/icon';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';

interface PricingTier {
  tier: string;
  price: string;
  description: string;
  isAccent?: boolean;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-for-patients',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, HeroComponent],
  template: `
    <div class="for-patients-page">
      <!-- 1. Hero / Header Banner Section -->
      <app-hero
        headline="Everything you need, in one place."
        i18n-headline="@@forPatients.headline"
        bodytext="Insurance, transparent pricing, your results, and billing — all designed to make your visit simple and stress-free."
        i18n-bodytext="@@forPatients.bodytext"
        [backgroundImage]="'assets/for_patients_hero.webp'"
      ></app-hero>

      <!-- 2. Shortcut CTA Cards Section (Desktop only) -->
      <section class="shortcut-cards-section">
        <div class="shortcut-grid">
          <a
            class="shortcut-card"
            [href]="links.testResults"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="icon-circle">
              <app-icon name="results" [size]="36" color="#365873"></app-icon>
            </div>
            <div class="shortcut-text-block">
              <h3 i18n="@@forPatients.shortcutViewResultsTitle">View Test Results</h3>
              <p i18n="@@forPatients.shortcutViewResultsText">
                Access your lab and diagnostic reports online.
              </p>
            </div>
          </a>

          <a class="shortcut-card" [href]="links.payBill" target="_blank" rel="noopener noreferrer">
            <div class="icon-circle">
              <app-icon name="credit-card" [size]="36" color="#365873"></app-icon>
            </div>
            <div class="shortcut-text-block">
              <h3 i18n="@@forPatients.shortcutPayBillTitle">Pay Your Bill</h3>
              <p i18n="@@forPatients.shortcutPayBillText">
                Quick, secure online payment for your recent visits.
              </p>
            </div>
          </a>

          <a class="shortcut-card" [routerLink]="links.saveMySpot">
            <div class="icon-circle">
              <app-icon name="location" [size]="36" color="#365873"></app-icon>
            </div>
            <div class="shortcut-text-block">
              <h3 i18n="@@forPatients.shortcutSaveSpotTitle">Save My Spot</h3>
              <p i18n="@@forPatients.shortcutSaveSpotText">
                Reserve your spot online and skip the waiting room.
              </p>
            </div>
          </a>
        </div>
      </section>

      <!-- 3. Transparent Self-Pay Pricing Section -->
      <section class="self-pay-section" id="self-pay-pricing">
        <div class="section-badge" i18n="@@forPatients.transparentSelfPayBadge">
          TRANSPARENT SELF-PAY
        </div>
        <h2 class="section-title" i18n="@@forPatients.transparentSelfPayTitle">
          No insurance? No surprises.
        </h2>
        <p class="section-subtitle" i18n="@@forPatients.transparentSelfPaySubtitle">
          Clear, upfront pricing by visit complexity — you'll always know what care costs before
          you're treated.
        </p>

        <div class="pricing-grid">
          @for (tier of pricingTiers; track tier.tier) {
            <div class="pricing-card">
              @if (tier.tier === 'TIER 1') {
                <span class="pricing-tier-label" i18n="@@forPatients.tier1">TIER 1</span>
                <div class="pricing-value">
                  <span class="price-amount" i18n="@@forPatients.tier1Price">$165</span>
                </div>
                <p class="pricing-description" i18n="@@forPatients.tier1Desc">
                  Ideal for common symptoms like coughs, sore throats, or routine check-ups.
                </p>
              } @else if (tier.tier === 'TIER 2') {
                <span class="pricing-tier-label" i18n="@@forPatients.tier2">TIER 2</span>
                <div class="pricing-value">
                  <span class="price-amount" i18n="@@forPatients.tier2Price">$225</span>
                </div>
                <p class="pricing-description" i18n="@@forPatients.tier2Desc">
                  Includes a clinical visit plus common point-of-care lab tests or minor treatments.
                </p>
              } @else if (tier.tier === 'TIER 3') {
                <span class="pricing-tier-label" i18n="@@forPatients.tier3">TIER 3</span>
                <div class="pricing-value">
                  <span class="price-amount" i18n="@@forPatients.tier3Price">$295</span>
                </div>
                <p class="pricing-description" i18n="@@forPatients.tier3Desc">
                  Advanced diagnostic care involving imaging, X-rays, or specialized medical tests.
                </p>
              } @else if (tier.tier === 'TIER 4') {
                <span class="pricing-tier-label" i18n="@@forPatients.tier4">TIER 4</span>
                <div class="pricing-value">
                  <span class="price-amount" i18n="@@forPatients.tier4Price">$375</span>
                </div>
                <p class="pricing-description" i18n="@@forPatients.tier4Desc">
                  Comprehensive care for complex medical needs or procedures requiring extended
                  observation.
                </p>
              }
            </div>
          }
        </div>

        <p class="pricing-disclaimer" i18n="@@forPatients.pricingDisclaimer">
          * Pricing reflects the visit; certain labs, imaging, or supplies may be billed separately.
          Confirm against your official provider rates.
        </p>
      </section>

      <!-- 4. Insurance Section -->
      @defer (
        on viewport;
        when routeFragment() === 'faqs';
        hydrate on viewport;
        hydrate when routeFragment() === 'faqs'
      ) {
        <section class="insurance-section" #insuranceSection>
          <div class="insurance-inner">
            <div class="section-badge" i18n="@@forPatients.insuranceBadge">INSURANCE</div>
            <h2 class="section-title" i18n="@@forPatients.insuranceTitle">
              We accept most major plans
            </h2>
            <p class="insurance-subtitle" i18n="@@forPatients.insuranceSubtitle">
              Bring your insurance card and a valid photo ID to every visit.
            </p>

            <div class="insurance-accordion">
              @for (group of insuranceGroups; track group.id) {
                <div
                  class="insurance-group-item"
                  [class.expanded]="expandedInsuranceGroupId() === group.id"
                >
                  <div
                    class="insurance-group-header"
                    (click)="toggleInsuranceGroup(group.id)"
                    (keydown.enter)="toggleInsuranceGroup(group.id)"
                    (keydown.space)="$event.preventDefault(); toggleInsuranceGroup(group.id)"
                    role="button"
                    tabindex="0"
                  >
                    @if (group.id === 'commercial') {
                      <h3 class="insurance-group-title" i18n="@@insurance.group.commercial">
                        Commercial & PPO Plans
                        <span class="insurance-count-badge">10</span>
                      </h3>
                    } @else if (group.id === 'medicaid') {
                      <h3 class="insurance-group-title" i18n="@@insurance.group.medicaid">
                        Medicaid & Managed Care
                        <span class="insurance-count-badge">14</span>
                      </h3>
                    } @else if (group.id === 'medicare') {
                      <h3 class="insurance-group-title" i18n="@@insurance.group.medicare">
                        Medicare & Government
                        <span class="insurance-count-badge">11</span>
                      </h3>
                    } @else if (group.id === 'provider') {
                      <h3 class="insurance-group-title" i18n="@@insurance.group.provider">
                        Provider Networks & Other Plans
                        <span class="insurance-count-badge">15</span>
                      </h3>
                    }
                    <div class="insurance-toggle-btn">
                      <app-icon
                        [name]="expandedInsuranceGroupId() === group.id ? 'up' : 'down'"
                        [size]="20"
                        color="#211E0D"
                      ></app-icon>
                    </div>
                  </div>
                  <div class="insurance-group-panel">
                    <div class="insurance-grid">
                      @for (plan of group.items; track plan.name) {
                        <div class="insurance-card">
                          <div class="logo-wrapper">
                            <img [src]="plan.logo" [alt]="plan.name" loading="lazy" />
                          </div>
                          <span class="plan-name">{{ plan.name }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      } @placeholder {
        <section class="insurance-section insurance-defer-placeholder" aria-hidden="true"></section>
      }

      <!-- 5. FAQs Section -->
      @defer (
        on viewport;
        when routeFragment() === 'faqs';
        hydrate on viewport;
        hydrate when routeFragment() === 'faqs'
      ) {
        <section class="faqs-section" id="faqs" #faqSection tabindex="-1">
          <div class="faqs-inner">
            <div class="section-badge" i18n="@@forPatients.faqsBadge">FAQS</div>
            <h2 class="section-title" i18n="@@forPatients.faqsTitle">Good to know before you go</h2>

            <div class="faqs-accordion">
              @for (faq of faqItems; track faq.id) {
                <div class="faq-item" [class.expanded]="expandedFaqId() === faq.id">
                  <div
                    class="faq-header"
                    (click)="toggleFaq(faq.id)"
                    (keydown.enter)="toggleFaq(faq.id)"
                    (keydown.space)="$event.preventDefault(); toggleFaq(faq.id)"
                    role="button"
                    tabindex="0"
                  >
                    @if (faq.id === 'appointment') {
                      <h3 class="faq-question" i18n="@@forPatients.faq1Question">
                        Do I need an appointment?
                      </h3>
                    } @else if (faq.id === 'labs') {
                      <h3 class="faq-question" i18n="@@forPatients.faq2Question">
                        What makes your lab testing different?
                      </h3>
                    } @else if (faq.id === 'insurance') {
                      <h3 class="faq-question" i18n="@@forPatients.faq3Question">
                        What if my insurance isn't listed?
                      </h3>
                    } @else if (faq.id === 'billing') {
                      <h3 class="faq-question" i18n="@@forPatients.faq4Question">
                        How will I receive my bill?
                      </h3>
                    } @else {
                      <h3 class="faq-question">{{ faq.question }}</h3>
                    }
                    <div class="faq-toggle-btn">
                      <app-icon
                        [name]="expandedFaqId() === faq.id ? 'up' : 'down'"
                        [size]="20"
                        color="#211E0D"
                      ></app-icon>
                    </div>
                  </div>
                  <div class="faq-answer-panel">
                    <div class="faq-answer-content">
                      @if (faq.id === 'appointment') {
                        <p i18n="@@forPatients.faq1Answer">
                          No, appointments are never required at Local MD Urgent Care. You can walk
                          in seven days a week, or reserve your spot online before you arrive to
                          minimize your wait time.
                        </p>
                      } @else if (faq.id === 'labs') {
                        <p i18n="@@forPatients.faq2Answer">
                          We utilize advanced point-of-care diagnostics right inside our clinics,
                          providing you with incredibly fast, accurate test results during your
                          visit rather than waiting days for an external lab.
                        </p>
                      } @else if (faq.id === 'insurance') {
                        <p i18n="@@forPatients.faq3Answer">
                          We offer highly transparent, low-cost self-pay tier rates for patients
                          without insurance or those with plans outside our primary coverage
                          network. Please call us to confirm your specific plan.
                        </p>
                      } @else if (faq.id === 'billing') {
                        <p i18n="@@forPatients.faq4Answer">
                          For any outstanding balance after your insurance processing, you will
                          receive a secure text link and paper statement allowing you to easily view
                          details and pay your bill online.
                        </p>
                      } @else {
                        <p>{{ faq.answer }}</p>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      } @placeholder {
        <section class="faqs-section faqs-defer-placeholder" id="faqs" aria-hidden="true"></section>
      }
    </div>
  `,
  styles: [
    `
      .for-patients-page {
        background-color: var(--white);
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow-x: hidden;
      }

      /* 1. Hero Content Styles */

      /* 2. Shortcut CTA Cards Section */
      .shortcut-cards-section {
        max-width: 1592px;
        width: 100%;
        margin: 0 auto;
        padding: 80px 32px 40px;
      }

      .shortcut-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        width: 100%;
      }

      .shortcut-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 24px;
        gap: 20px;
        border: 2px solid #8c8c8c;
        border-radius: 16px;
        text-decoration: none;
        transition:
          transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
          border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1),
          box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
        background-color: var(--white);
      }

      .shortcut-card:hover {
        transform: translateY(-2px);
        border-color: var(--slate-blue);
        box-shadow: 0 10px 30px rgba(54, 88, 115, 0.08);
      }

      .icon-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 78px;
        height: 78px;
        border-radius: 50%;
        background-color: rgba(54, 88, 115, 0.08);
        flex-shrink: 0;
      }

      .shortcut-text-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .shortcut-text-block h3 {
        font-family: var(--font-body);
        font-size: 36px;
        font-weight: 600;
        color: #151515;
        line-height: 49px;
        margin: 0;
      }

      .shortcut-text-block p {
        font-family: var(--font-body);
        font-size: 24px;
        color: #5b5656;
        margin: 0;
        line-height: 33px;
        font-weight: 600;
      }

      /* Common Section Badge style */
      .section-badge {
        font-family: var(--font-body);
        font-size: 30px;
        font-weight: 800;
        color: var(--accent-crimson);
        text-transform: uppercase;
        margin-bottom: 12px;
        line-height: 41px;
      }

      .section-subtitle {
        font-family: var(--font-body);
        font-size: 20px;
        font-weight: 400;
        color: #5b5656;
        margin: 0 auto 48px;
        max-width: 680px;
        line-height: 32px;
      }

      /* 3. Transparent Self-Pay Pricing Section */
      .self-pay-section {
        max-width: 1592px;
        width: 100%;
        margin: 0 auto;
        padding: 80px 32px;

        text-align: center;
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.8) 15%,
          rgba(212, 31, 56, 0.03) 65%
        );
        border-radius: 24px;
      }

      .pricing-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        width: 100%;
        margin-bottom: 40px;
      }

      .pricing-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px;
        gap: 20px;
        background-color: var(--white);
        border: 1px solid #e5e5e5;
        border-radius: 16px;
        transition: all 0.3s ease;
      }

      .pricing-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
      }

      .pricing-tier-label {
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 700;
        color: #5b5656;
        text-transform: uppercase;
        line-height: 19px;
      }

      .pricing-value {
        display: flex;
        align-items: baseline;
        gap: 2px;
      }

      .price-amount {
        font-family: var(--font-heading);
        font-size: 64px;
        font-weight: 400;
        color: #211e0d;
        line-height: 80px;
      }

      .pricing-description {
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 24px;
        color: #5b5656;
        text-align: center;
        margin: 0;
        font-weight: 400;
      }

      .pricing-disclaimer {
        font-family: var(--font-body);
        font-size: 16px;
        color: #8c8c8c;
        max-width: 628px;
        margin: 0 auto;
        line-height: 22px;
        font-weight: 400;
      }

      /* 4. Insurance Section */
      .insurance-section {
        max-width: 1592px;
        width: 100%;
        margin: 0 auto;
        padding: 80px 32px;
      }

      .insurance-defer-placeholder {
        min-height: 560px;
      }

      .insurance-inner {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        width: 100%;
      }

      .insurance-subtitle {
        font-family: var(--font-body);
        font-size: 18px;
        color: #5b5656;
        margin: 0 0 40px;
        line-height: 24px;
        font-weight: 400;
      }

      .insurance-accordion {
        display: flex;
        flex-direction: column;
        width: 100%;
        gap: 20px;
      }

      .insurance-group-item {
        border: 1px solid #e5e5e5;
        border-radius: 16px;
        background-color: var(--white);
        padding: 24px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      }

      .insurance-group-item:hover {
        border-color: #d41f38;
        box-shadow: 0 8px 24px rgba(212, 31, 56, 0.05);
      }

      .insurance-group-item.expanded {
        border-color: #d41f38;
        box-shadow: 0 12px 32px rgba(212, 31, 56, 0.08);
      }

      .insurance-group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        cursor: pointer;
        outline: none;
      }

      .insurance-group-header:focus-visible {
        outline: 2px solid #d41f38;
        outline-offset: 8px;
        border-radius: 4px;
      }

      .insurance-group-title {
        font-family: var(--font-body);
        font-size: 24px;
        font-weight: 700;
        color: #211e0d;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        line-height: 1.3;
      }

      .insurance-count-badge {
        font-family: var(--font-body);
        background-color: #d41f38;
        color: var(--white);
        font-size: 14px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        line-height: 1;
        display: inline-block;
      }

      .insurance-toggle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.3s ease;
      }

      .insurance-group-panel {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .insurance-group-item.expanded .insurance-group-panel {
        max-height: 2500px;
        opacity: 1;
        margin-top: 24px;
      }

      .insurance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
        gap: 16px;
        width: 100%;
        padding-bottom: 8px;
      }

      .insurance-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px 12px;
        background: var(--white);
        border: 1px solid #ededed;
        border-radius: 12px;
        transition: all 0.25s ease;
        text-align: center;
        cursor: default;
        width: 100%;
        min-width: min(250px, 100%);
        max-width: 300px;
        min-height: 180px;
        margin: 0 auto;
      }

      .insurance-card:hover {
        transform: translateY(-3px);
        border-color: #ccc;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
      }

      .logo-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 80px;
        width: 100%;
        margin-bottom: 12px;
      }

      .logo-wrapper img {
        max-height: 100%;
        max-width: 100%;
        object-fit: contain;
      }

      .plan-name {
        font-family: var(--font-body);
        font-size: 16px;
        font-weight: 600;
        color: #4a4a4a;
        line-height: 1.3;
      }

      @media (max-width: 992px) {
        .insurance-group-title {
          font-size: 22px;
        }
      }

      @media (max-width: 768px) {
        .insurance-group-item {
          padding: 20px;
        }
        .insurance-group-title {
          font-size: 20px;
        }
      }

      @media (max-width: 576px) {
        .insurance-grid {
          gap: 14px;
        }
        .insurance-card {
          padding: 20px 14px;
        }
        .logo-wrapper {
          height: 70px;
        }
      }

      @media (max-width: 480px) {
        .insurance-grid {
          gap: 12px;
        }
        .insurance-card {
          padding: 16px 10px;
        }
        .logo-wrapper {
          height: 65px;
          margin-bottom: 10px;
        }
      }

      /* 5. FAQs Section Accordion */
      .faqs-section {
        max-width: 1592px;
        width: 100%;
        margin: 0 auto;
        padding: 80px 32px;
      }

      .faqs-defer-placeholder {
        min-height: 480px;
      }

      .faqs-inner {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
        width: 100%;
      }

      .faqs-accordion {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 813px;
        margin-top: 40px;
        gap: 28px;
      }

      .faq-item {
        border-bottom: 2px solid #8c8c8c;
        width: 100%;
      }

      .faq-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 24px;
        cursor: pointer;
        padding: 20px 8px; /* Safe interactive vertical target */
        width: 100%;

        outline: none;
      }

      .faq-header:focus-visible {
        background-color: rgba(212, 31, 56, 0.02);
        border-radius: 8px;
      }

      .faq-question {
        font-family: var(--font-body);
        font-size: 36px;
        font-weight: 600;
        color: #211e0d;
        margin: 0;
        line-height: 49px;
      }

      .faq-toggle-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: transform 0.3s ease;
      }

      .faq-answer-panel {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 0 8px;
      }

      .faq-item.expanded .faq-answer-panel {
        max-height: 200px;
        opacity: 1;
        padding-bottom: 20px;
      }

      .faq-answer-content p {
        font-family: var(--font-body);
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--text-muted);
        margin: 0;
      }

      /* Responsive Breakpoints */
      @media (max-width: 1200px) {
        .shortcut-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        /* Omit shortcuts block on mobile/tablet view like the design mockup */
        .shortcut-cards-section {
          display: none;
        }

        .section-badge {
          font-size: 24px;
          line-height: 33px;
        }

        .section-title {
          font-size: 48px;
          line-height: 53px;
        }

        .section-subtitle {
          font-size: 18px;
          line-height: 29px;
        }

        .pricing-grid {
          grid-template-columns: repeat(2, 1fr);
        }

        .pricing-card {
          border: 1px solid #8c8c8c;
        }

        .price-amount {
          font-size: 48px;
          line-height: 60px;
        }

        .pricing-description {
          font-size: 14px;
          line-height: 21px;
        }
      }

      @media (max-width: 768px) {
        .pricing-grid {
          grid-template-columns: 1fr;
        }

        .self-pay-section,
        .insurance-section,
        .faqs-section {
          padding: 40px 16px;
          text-align: left;
        }

        .section-badge {
          font-size: 20px;
          line-height: 27px;
          text-align: left;
        }

        .section-title {
          font-size: 36px;
          line-height: 45px;
          text-align: left;
        }

        .section-subtitle {
          font-size: 16px;
          line-height: 24px;
          text-align: left;
          margin-left: 0;
          margin-right: 0;
          margin-bottom: 24px;
        }

        .faq-question {
          font-size: 20px;
          line-height: 28px;
        }
      }
    `,
  ],
})
export class ForPatientsComponent {
  protected readonly links = environment.links;
  protected readonly routeFragment = toSignal(inject(ActivatedRoute).fragment);
  private readonly faqSection = viewChild<ElementRef<HTMLElement>>('faqSection');
  private readonly insuranceSection = viewChild<ElementRef<HTMLElement>>('insuranceSection');
  private readonly viewportScroller = inject(ViewportScroller);

  constructor() {
    afterRenderEffect({
      mixedReadWrite: () => {
        // The FAQ offset changes when preceding deferred content renders. Scroll only
        // once both sections exist, then focus the target rather than the footer link.
        if (this.routeFragment() === 'faqs' && this.faqSection() && this.insuranceSection()) {
          this.viewportScroller.scrollToAnchor('faqs', { behavior: 'instant' });
        }
      },
    });
    inject(SeoService).setMetadata({
      title: 'Patient Resources, Insurance Information & FAQs',
      description:
        'Prepare for your visit at Local MD. Access patient intake forms, check accepted insurance plans, view billing information, and read our patient FAQs.',
      image: '/assets/for_patients_hero.webp',
      path: '/for-patients',
    });
  }

  protected readonly expandedFaqId = signal<string>('');
  protected readonly expandedInsuranceGroupId = signal<string>('commercial');

  protected readonly insuranceGroups = [
    {
      id: 'commercial',
      items: [
        { name: 'Aetna', logo: '/logos/aetna-logo.webp' },
        { name: 'Ambetter', logo: '/logos/Ambetter.webp' },
        {
          name: 'Blue Cross Blue Shield of IL',
          logo: '/logos/Blue-Cross-and-Blue-Shield-of-Illinois-BCBSIL-Logo-Vector.svg-.webp',
        },
        { name: 'Blue High Performance Network', logo: '/logos/Blue-Cross-Blue-Shield-Logo.webp' },
        { name: 'Cigna', logo: '/logos/cigna.webp' },
        { name: 'Humana', logo: '/logos/Humana-Logo-Web3.webp' },
        { name: 'UnitedHealthcare', logo: '/logos/United-HealthCare.webp' },
        { name: 'Oscar Network', logo: '/logos/oscar1-300x150.webp' },
        { name: 'Imagine Health', logo: '/logos/imagine health.webp' },
        { name: 'Sana Benefits', logo: '/logos/sana-logo-color.webp' },
      ],
    },
    {
      id: 'medicaid',
      items: [
        { name: 'Aetna Better Health', logo: '/logos/Aetna-Better-Health.webp' },
        { name: 'Aetna Better Health IL', logo: '/logos/Aetna-Better-Health-Of-IL.webp' },
        {
          name: 'BCBS Community Options',
          logo: '/logos/Blue-Cross-and-Blue-Shield-of-Illinois-BCBSIL-Logo-Vector.svg-.webp',
        },
        { name: 'BCBS IL MMAI', logo: '/logos/Blue-Cross-Blue-Shield-Logo.webp' },
        { name: 'CountyCare', logo: '/logos/countycare-site-logo.webp' },
        { name: 'Meridian - Medicaid', logo: '/logos/meridian-logo-300.webp' },
        {
          name: 'Molina Healthcare of IL',
          logo: '/logos/Molina-Healthcare-Logo-Stacked-964x1024-1.webp',
        },
        { name: 'Illinois Medicaid', logo: '/logos/illinois medicaid.webp' },
        { name: 'Harmony Health Plan', logo: '/logos/harmony_logo-1.webp' },
        { name: 'WellCare', logo: '/logos/harmony_logo-1.webp' },
        { name: 'YouthCare', logo: '/logos/youthcare-logo.webp' },
        { name: 'Zing Health', logo: '/logos/zing_health_logo.webp' },
        { name: 'Mira', logo: '/logos/Mira_Mark.webp' },
        { name: 'Campus Care - UIC', logo: '/logos/campus_care-.webp' },
      ],
    },
    {
      id: 'medicare',
      items: [
        {
          name: 'Blue Cross IL Medicare Advantage',
          logo: '/logos/Blue-Cross-and-Blue-Shield-of-Illinois-BCBSIL-Logo-Vector.svg-.webp',
        },
        { name: 'Devoted Health', logo: '/logos/Devoted_Health_Plans_Logo.webp' },
        { name: 'Essence Healthcare', logo: '/logos/essence.webp' },
        { name: 'Medicare Illinois', logo: '/logos/Medicare-Symbol.webp' },
        { name: 'Medicare DME', logo: '/logos/Medicare-Symbol.webp' },
        { name: 'Railroad Medicare IL', logo: '/logos/Medicare-Symbol.webp' },
        { name: 'Meridian - Medicare', logo: '/logos/meridian-logo-300.webp' },
        { name: 'HealthNet Federal Services', logo: '/logos/Health_Net_logo.webp' },
        {
          name: 'TriWest Healthcare Alliance',
          logo: '/logos/triwest-healthcare-alliance-logo-png_seeklogo-264972.webp',
        },
        { name: 'TRICARE', logo: '/logos/US-TRICARE-Logo.svg.webp' },
        { name: 'Veterans Affairs (Urgent Care)', logo: '/logos/Medicare-Symbol.webp' },
      ],
    },
    {
      id: 'provider',
      items: [
        { name: "America's Choice Provider Network", logo: '/logos/acpn.webp' },
        { name: 'First Health Network', logo: '/logos/First-Health-for-rehab-hillside.webp' },
        { name: 'HealthLink', logo: '/logos/health-link-logo-png-transparent.webp' },
        { name: 'Hooray Health', logo: '/logos/Hooray Health.webp' },
        { name: 'Independent Medical Systems', logo: '/logos/independent-medical.webp' },
        { name: 'McLaren Health', logo: '/logos/McLaren_.webp' },
        { name: 'MultiPlan / Claritiev', logo: '/logos/MultiPlan-Corporation.webp' },
        { name: 'Partners Direct Health', logo: '/logos/partners direct.webp' },
        { name: 'PHCS', logo: '/logos/phcs.webp' },
        { name: 'Provider Network of America', logo: '/logos/pnoa.webp' },
        {
          name: 'USA Managed Care Organization',
          logo: '/logos/USA_Managed_Care_Organization_Logo-removebg-preview.webp',
        },
        {
          name: 'The American Worker',
          logo: '/logos/The_American_Worker_logo-removebg-preview.webp',
        },
        { name: 'CareWorks', logo: '/logos/careworks_consultants_inc__logo.webp' },
        { name: 'CorVel', logo: '/logos/corvel.webp' },
        { name: 'Zelis', logo: '/logos/Zelis-.webp' },
      ],
    },
  ];

  protected toggleInsuranceGroup(id: string): void {
    if (this.expandedInsuranceGroupId() === id) {
      this.expandedInsuranceGroupId.set('');
    } else {
      this.expandedInsuranceGroupId.set(id);
    }
  }

  protected readonly pricingTiers: PricingTier[] = [
    {
      tier: 'TIER 1',
      price: '$165',
      description: 'Ideal for common symptoms like coughs, sore throats, or routine check-ups.',
    },
    {
      tier: 'TIER 2',
      price: '$225',
      description:
        'Includes a clinical visit plus common point-of-care lab tests or minor treatments.',
    },
    {
      tier: 'TIER 3',
      price: '$295',
      description:
        'Advanced diagnostic care involving imaging, X-rays, or specialized medical tests.',
    },
    {
      tier: 'TIER 4',
      price: '$375',
      description:
        'Comprehensive care for complex medical needs or procedures requiring extended observation.',
    },
  ];

  protected readonly faqItems: FaqItem[] = [
    {
      id: 'appointment',
      question: 'Do I need an appointment?',
      answer:
        'No, appointments are never required at Local MD Urgent Care. You can walk in seven days a week, or reserve your spot online before you arrive to minimize your wait time.',
    },
    {
      id: 'labs',
      question: 'What makes your lab testing different?',
      answer:
        'We feature our own state-of-the-art in-house laboratory. This means your lab samples do not have to be sent to an external facility, allowing us to deliver precise results in hours rather than days.',
    },
    {
      id: 'results',
      question: 'How do I get my test results?',
      answer:
        'Your test results are published directly to your secure patient portal as soon as they are processed. You will receive an email or text notification with a secure link to view them.',
    },
    {
      id: 'bring',
      question: 'What should I bring?',
      answer:
        "Please bring a valid government-issued photo ID and your insurance card if you're using insurance. All privately insured patients are required to keep a valid credit or debit card on file, which will only be charged for applicable copays, deductibles, coinsurance, or other patient-responsible balances after your insurance has processed the claim; if you're paying out of pocket, please be ready to pay for services at the time of your visit. We're currently unable to accept Apple Pay, Google Wallet, or similar digital wallets, so a traditional debit or credit card is needed.",
    },
    {
      id: 'pay',
      question: 'How do I pay my bill?',
      answer:
        'You can pay your bill easily and securely online through our patient payment portal. We accept all major credit/debit cards, HSA/FSA cards, and bank transfers.',
    },
  ];

  protected toggleFaq(id: string): void {
    if (this.expandedFaqId() === id) {
      this.expandedFaqId.set('');
    } else {
      this.expandedFaqId.set(id);
    }
  }
}
