import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../components/icon/icon';
import { SeoService } from '../../services/seo.service';
import { HeroComponent } from '../../components/shared/hero/hero';
import { CtaBannerComponent } from '../../components/shared/cta-banner/cta-banner';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-weight-loss',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, HeroComponent, CtaBannerComponent],
  template: `
    <div class="weight-loss-page">
      <!-- Section 1: Hero Section -->
      <app-hero
        headline="Lose the weight."
        em="Keep the support."
        bodytext="A medically supervised GLP-1 program from the clinicians you already trust — real medication, real monitoring, and a care team that follows your progress every step of the way."
        [backgroundImage]="'assets/glp1-hero-clinical.webp'"
      >
        <div class="hero-actions">
          <a routerLink="/locations" class="primary-btn hero-btn">Book Consult</a>
        </div>
      </app-hero>

      <!-- Section 2: Appetite & hunger signalling -->
      <section class="blk biology-sec">
        <div class="wrap">
          <div class="head">
            <div class="eyebrow">Weight Loss</div>
            <h2>More than a diet — a change in how your body signals hunger</h2>
            <p class="intro">
              GLP-1 medications work with your body's own biology to quiet appetite, slow digestion,
              and steady blood sugar — which is why so many patients describe finally feeling
              <span class="hl">in control of food</span> instead of fighting it. At Local MD, that
              medication comes with real medical oversight from the same network you already trust.
            </p>
          </div>

          <div class="cards">
            <div class="card">
              <div class="accent-bar"></div>
              <div class="ic">
                <svg viewBox="0 0 24 24">
                  <path d="M12 4v10"></path>
                  <path d="M7 11l5 5 5-5"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
              </div>
              <div class="card-content">
                <h3>Real appetite control</h3>
                <p>
                  GLP-1s reduce hunger signals and <span class="hl">food cravings</span>, so smaller
                  portions feel satisfying and the constant "food noise" quiets down.
                </p>
              </div>
            </div>

            <div class="card">
              <div class="accent-bar"></div>
              <div class="ic">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9"></circle>
                  <path d="M12 7v5l3 2"></path>
                </svg>
              </div>
              <div class="card-content">
                <h3>Feel full, longer</h3>
                <p>
                  By slowing how quickly your stomach empties, these medications help you stay
                  <span class="hl">comfortably full</span> between meals without willpower battles.
                </p>
              </div>
            </div>

            <div class="card">
              <div class="accent-bar"></div>
              <div class="ic">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M20.8 6.6a5 5 0 0 0-8.8-1.6A5 5 0 0 0 3.2 6.6c-1 2.7.9 5.3 2.8 7.2L12 19l6-5.2c1.9-1.9 3.8-4.5 2.8-7.2z"
                  ></path>
                </svg>
              </div>
              <div class="card-content">
                <h3>Metabolic benefits</h3>
                <p>
                  Beyond the scale, GLP-1 therapy can support healthier
                  <span class="hl">blood sugar</span> and cardiometabolic markers under medical
                  guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 3: The Medications -->
      <section class="blk meds-sec">
        <div class="wrap">
          <div class="head text-center">
            <div class="eyebrow">The Medications</div>
            <h2>Two proven options, guided by your provider</h2>
            <p class="intro">
              Your clinician recommends the right medication and dose for your health history and
              goals — then adjusts it over time. Both are a single, once-weekly injection.
            </p>
          </div>

          <div class="meds">
            <div class="med">
              <span class="tag">GLP-1</span>
              <h3 class="med-title">Semaglutide</h3>
              <div class="sub">Once-weekly injection</div>
              <div class="stat">
                ~15%
                <span
                  >average body-weight reduction in clinical trials over 68 weeks, alongside
                  lifestyle changes</span
                >
              </div>
              <ul>
                <li>A well-established track record for weight management</li>
                <li>Gradual dose increases to improve tolerability</li>
                <li>A strong starting point for most patients</li>
              </ul>
            </div>

            <div class="med feature">
              <span class="tag">GIP + GLP-1</span>
              <h3 class="med-title">Tirzepatide</h3>
              <div class="sub">Once-weekly injection</div>
              <div class="stat">
                ~21%
                <span
                  >average body-weight reduction at the highest dose in clinical trials over 72
                  weeks</span
                >
              </div>
              <ul>
                <li>Dual-action mechanism targeting two hunger pathways</li>
                <li>Among the most effective options available today</li>
                <li>Ideal for patients seeking maximum results</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4: How It Works -->
      <section class="blk steps-sec">
        <div class="wrap">
          <div class="head">
            <div class="eyebrow">How It Works</div>
            <h2>Simple from day one</h2>
          </div>
          <div class="steps">
            <div class="step">
              <div class="n">01</div>
              <h3>Consult</h3>
              <p>
                Meet with a provider to review your history, goals, and whether GLP-1 therapy is
                right for you.
              </p>
            </div>
            <div class="step">
              <div class="n">02</div>
              <h3>Personalize</h3>
              <p>
                We match you to semaglutide or tirzepatide and a starting dose built around your
                needs.
              </p>
            </div>
            <div class="step">
              <div class="n">03</div>
              <h3>Start &amp; monitor</h3>
              <p>
                Begin your once-weekly injection with clear instructions and a care team tracking
                your progress.
              </p>
            </div>
            <div class="step">
              <div class="n">04</div>
              <h3>Adjust &amp; sustain</h3>
              <p>
                Regular check-ins let us fine-tune your dose and keep you moving toward your goal
                safely.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 5: Pricing -->
      <section class="blk pricing-sec" id="pricing">
        <div class="wrap">
          <div class="head text-center">
            <div class="eyebrow">Getting Started</div>
            <h2>Simple, transparent pricing</h2>
            <p class="intro">
              No insurance approvals and no surprise bills. Start with a provider consultation, and
              your monthly membership includes your medication and ongoing care.
            </p>
          </div>

          <div class="price-wrap">
            <div class="price-box promo">
              <div class="k">Initial Consultation</div>
              <div class="amt">
                <span class="orig">$149</span>
                <span class="promo-price">$99</span>
              </div>
              <div class="promo-badge">Promotional pricing now through September 1, 2026</div>
              <div class="d">
                A one-time provider evaluation to review your history, discuss goals, and build your
                plan.
              </div>
              <a routerLink="/locations" class="go">Book Consult</a>
            </div>
          </div>
          <p class="price-note">
            Monthly membership, with medication included, starts at $149/month.
          </p>
        </div>
      </section>

      <!-- Section 6: FAQs -->
      @defer (on viewport; hydrate on viewport) {
        <section class="blk faqs-section">
          <div class="wrap">
            <div class="faqs-inner">
              <div class="eyebrow">FAQs</div>
              <h2>Good to know</h2>
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
                      <h3 class="faq-question">{{ faq.question }}</h3>
                      <div class="faq-toggle-btn">
                        <app-icon
                          [name]="expandedFaqId() === faq.id ? 'up' : 'down'"
                          [size]="32"
                        ></app-icon>
                      </div>
                    </div>

                    <div class="faq-answer-panel">
                      <div class="faq-answer-content">
                        <p [innerHTML]="faq.answer"></p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </section>
      } @placeholder {
        <section class="blk faqs-section faqs-defer-placeholder" aria-hidden="true"></section>
      }

      <app-cta-banner
        title="One visit. Everything you need."
        i18n-title="@@ctaBanner.oneVisit.title"
        description="Treatment, testing, and the equipment to recover — all under one roof."
        i18n-description="@@ctaBanner.oneVisit.desc"
        buttonText="BOOK CONSULT"
        i18n-buttonText="@@header.cta.saveMySpot"
        buttonLink="/locations"
      ></app-cta-banner>
    </div>
  `,
  styles: [
    `
      .weight-loss-page {
        background-color: var(--white);
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow-x: hidden;
      }

      /* Base Content Wrapper */
      .blk {
        padding: 80px 0;
      }

      .wrap {
        max-width: 1528px;
        width: calc(100% - 64px);
        margin: 0 auto;
      }

      /* Headings & Headers */
      .head {
        text-align: left;
        max-width: 1160px;
        margin-bottom: 56px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .head.text-center {
        text-align: center;
        margin-left: auto;
        margin-right: auto;
        align-items: center;
      }

      .eyebrow {
        font-family: var(--font-body);
        font-size: 30px;
        font-weight: 800;
        color: var(--accent-crimson);
        text-transform: uppercase;
        line-height: 41px;
      }

      h2 {
        font-family: var(--font-heading);
        font-size: 64px;
        font-weight: 400;
        line-height: 80px;
        color: #211e0d;
        margin: 0;
      }

      .intro {
        font-family: var(--font-body);
        font-weight: 600;
        font-size: 24px;
        line-height: 33px;
        color: var(--text-muted, #5b5656);
        margin: 14px 0 0 0;
      }

      .hl {
        color: var(--accent-crimson);
        font-weight: 700;
      }

      /* Hero Component Button Styles Override */
      .hero-actions {
        margin-top: 24px;
      }

      /* Section 2: Biology Section / Cards */
      .cards {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 32px;
        margin-top: 56px;
      }

      .card {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        padding: 40px 40px 40px 48px; /* Extra left padding to clear the accent-bar */
        gap: 24px;
        background-color: var(--white);
        border: 2px solid #8c8c8c;
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
      }

      .card .accent-bar {
        width: 8px;
        height: 100%;
        background-color: var(--accent-crimson, #d41f38);
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        border-radius: 12px 0 0 12px;
        z-index: 2;
      }

      .card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(212, 31, 56, 0.08);
        border-color: var(--accent-crimson, #d41f38);
      }

      .ic {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background-color: rgba(212, 31, 56, 0.05);
        color: var(--accent-crimson);
        flex-shrink: 0;
      }

      .ic svg {
        width: 32px;
        height: 32px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .card-content h3 {
        font-family: var(--font-body);
        font-size: 28px;
        font-weight: 700;
        color: #211e0d;
        margin: 0 0 12px 0;
        line-height: 1.3;
      }

      .card-content p {
        font-family: var(--font-body);
        font-size: 18px;
        line-height: 1.6;
        color: #5b5656;
        margin: 0;
      }

      /* Section 3: Medications Section */
      .meds-sec {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.8) 15%,
          rgba(212, 31, 56, 0.02) 65%
        );
      }

      .meds {
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: stretch;
        gap: 48px;
        max-width: 1200px;
        margin: 56px auto 0;
      }

      .med {
        flex: 1;
        max-width: 536px;
        display: flex;
        flex-direction: column;
        padding: 48px 32px 36px 32px;
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 3px 5px 7px rgba(119, 119, 119, 0.16);
        border: 2px solid #8c8c8c;
        position: relative;
        transition: all 0.3s ease;
      }

      .med:hover {
        transform: translateY(-4px);
        box-shadow: 3px 8px 18px rgba(119, 119, 119, 0.28);
      }

      .med.feature {
        border: 2px solid var(--accent-crimson, #d41f38);
        box-shadow: 3px 5px 15px rgba(212, 31, 56, 0.1);
      }

      .med.feature:hover {
        box-shadow: 3px 8px 24px rgba(212, 31, 56, 0.18);
      }

      .med-title {
        font-family: var(--font-body);
        font-size: 32px;
        font-weight: 700;
        color: #211e0d;
        margin: 0 0 8px 0;
        line-height: 1.2;
        padding-right: 120px; /* Ample clearance for top-right corner badge */
      }

      .med .tag {
        position: absolute;
        top: 16px;
        right: 16px;
        background: #f5f5f5;
        color: #5b5656;
        font-weight: 700;
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 12px;
        font-family: var(--font-body);
        text-transform: uppercase;
        white-space: nowrap;
        z-index: 2;
      }

      .med.feature .tag {
        background: var(--accent-crimson);
        color: #ffffff;
      }

      .med .sub {
        font-family: var(--font-body);
        font-size: 18px;
        color: #5b5656;
        margin-bottom: 28px;
        font-weight: 500;
      }

      .med .stat {
        font-family: var(--font-heading);
        font-size: 64px;
        color: var(--accent-crimson);
        margin-bottom: 32px;
        line-height: 1.1;
        display: flex;
        flex-direction: column;
      }

      .med .stat span {
        font-family: var(--font-body);
        font-size: 16px;
        color: #5b5656;
        font-weight: 500;
        line-height: 1.5;
        margin-top: 8px;
      }

      .med ul {
        list-style: none;
        padding: 0;
        margin: 24px 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 18px;
        border-top: 1px solid #ededed;
        padding-top: 24px;
      }

      .med li {
        font-family: var(--font-body);
        font-size: 18px;
        color: #5b5656;
        padding-left: 32px;
        position: relative;
        line-height: 1.4;
      }

      .med li::before {
        content: '';
        position: absolute;
        left: 0;
        top: 3px;
        width: 18px;
        height: 18px;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23d41f38" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>');
        background-size: contain;
        background-repeat: no-repeat;
      }

      /* Section 4: Steps Section */
      .steps {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 24px;
        margin-top: 56px;
      }

      .step {
        display: flex;
        flex-direction: column;
        background: #ffffff;
        padding: 36px;
        border-radius: 16px;
        border: 2px solid #8c8c8c;
        transition: all 0.3s ease;
      }

      .step:hover {
        transform: translateY(-4px);
        border-color: var(--accent-crimson);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.05);
      }

      .step .n {
        font-family: var(--font-heading);
        font-size: 48px;
        color: var(--accent-crimson);
        margin-bottom: 20px;
        opacity: 0.9;
        line-height: 1;
      }

      .step h3 {
        font-family: var(--font-body);
        font-size: 24px;
        font-weight: 700;
        color: #211e0d;
        margin: 0 0 12px 0;
      }

      .step p {
        font-family: var(--font-body);
        font-size: 16px;
        line-height: 1.6;
        color: #5b5656;
        margin: 0;
      }

      /* Section 5: Pricing Section */
      .pricing-sec {
        background-color: #fdf5f5; /* Soft full-width crimson tint background */
      }

      .price-wrap {
        display: flex;
        flex-direction: row;
        gap: 32px;
        justify-content: center;
        max-width: 500px;
        margin: 56px auto 32px;
      }

      .price-box {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px;
        background-color: var(--white);
        border: 2px solid var(--accent-crimson, #d41f38);
        border-radius: 20px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 4px 20px rgba(212, 31, 56, 0.04);
        text-align: center;
      }

      .price-box:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 30px rgba(212, 31, 56, 0.08);
      }

      .price-box .k {
        font-family: var(--font-body);
        font-size: 14px;
        font-weight: 800;
        color: #5b5656;
        text-transform: uppercase;
        margin-bottom: 20px;
        letter-spacing: 0.05em;
      }

      .price-box.promo {
        border-color: var(--accent-gold, #e8a838);
        box-shadow: 0 4px 20px rgba(232, 168, 56, 0.1);
      }

      .price-box.promo:hover {
        box-shadow: 0 12px 30px rgba(232, 168, 56, 0.15);
      }

      .price-box .amt {
        font-family: var(--font-heading);
        font-size: 80px;
        color: var(--accent-crimson, #d41f38);
        line-height: 1;
        margin-bottom: 24px;
        font-weight: 800;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .price-box .orig {
        font-size: 36px;
        color: #b0b0b0;
        text-decoration: line-through;
        font-weight: 600;
        line-height: 1;
      }

      .price-box .promo-price {
        font-size: 80px;
        font-weight: 800;
        line-height: 1;
        color: var(--accent-crimson, #d41f38);
      }

      .promo-badge {
        font-family: var(--font-body);
        font-size: 15px;
        font-weight: 700;
        color: var(--accent-gold, #b8860b);
        letter-spacing: 0.02em;
        margin-bottom: 8px;
      }

      .price-box .d {
        font-family: var(--font-body);
        font-size: 18px;
        line-height: 1.6;
        color: #5b5656;
        margin-bottom: 36px;
        flex-grow: 1;
        font-weight: 500;
      }

      .price-box .go {
        background-color: var(--accent-crimson);
        color: #ffffff;
        border-radius: 16px;
        padding: 16px 32px;
        font-family: var(--font-body);
        font-size: 16px;
        font-weight: 700;
        text-decoration: none;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s ease;
        width: 100%;

        text-transform: uppercase;
      }

      .price-box .go:hover {
        background-color: #b8152c;
        transform: translateY(-2px);
      }

      .price-note {
        font-family: var(--font-body);
        font-size: 18px;
        color: #5b5656;
        text-align: center;
        margin-top: 32px;
        font-weight: 500;
      }

      /* Section 6: FAQs Section */
      .faqs-section {
        background-color: #fafafa;
        border-top: 1px solid #ededed;
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
        max-width: 900px;
        margin-top: 40px;
        gap: 24px;
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
        padding: 24px 8px; /* Great touch and click area taking the full header size */
        width: 100%;

        outline: none;
      }

      .faq-header:focus-visible {
        background-color: rgba(212, 31, 56, 0.02);
        border-radius: 8px;
      }

      .faq-question {
        font-family: var(--font-body);
        font-size: 28px;
        font-weight: 700;
        color: #211e0d;
        margin: 0;
        line-height: 38px;
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
        max-height: 250px;
        opacity: 1;
        padding-bottom: 24px; /* Smooth padding at the bottom when expanded */
      }

      .faq-answer-content p {
        font-family: var(--font-body);
        font-size: 18px;
        line-height: 1.6;
        color: var(--text-muted, #5b5656);
        margin: 0;
        font-weight: 500;
      }

      /* Responsive Breakpoints */
      @media (max-width: 1200px) {
        .eyebrow {
          font-size: 24px;
          line-height: 33px;
        }

        h2 {
          font-size: 48px;
          line-height: 60px;
        }

        .intro {
          font-size: 20px;
          line-height: 28px;
        }

        .cards {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .meds {
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .med {
          width: 100%;
          max-width: 100%;
          padding: 40px;
        }

        .steps {
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .price-wrap {
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .price-box {
          width: 100%;
          max-width: 100%;
          padding: 36px;
        }
      }

      @media (max-width: 768px) {
        .blk {
          padding: 40px 0;
        }

        .wrap {
          width: calc(100% - 32px);
          padding: 0 16px;
        }

        .head {
          margin-bottom: 32px;
          gap: 8px;
        }

        .eyebrow {
          font-size: 20px;
          line-height: 27px;
        }

        h2 {
          font-size: 36px;
          line-height: 45px;
        }

        .intro {
          font-size: 16px;
          line-height: 24px;
          margin-top: 10px;
        }

        .cards {
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 32px;
        }

        .card {
          padding: 24px 20px 24px 28px;
          gap: 16px;
          flex-direction: column;
          align-items: flex-start;
          border-radius: 12px;
        }

        .card-content h3 {
          font-size: 22px;
          line-height: 30px;
          margin-bottom: 8px;
        }

        .card-content p {
          font-size: 15px;
          line-height: 22px;
        }

        .meds {
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .med {
          width: 100%;
          padding: 36px 16px 24px 16px;
          border-radius: 12px;
          position: relative;
        }

        .med-title {
          font-size: 22px;
          line-height: 28px;
          padding-right: 100px;
        }

        .med .tag {
          top: 10px;
          right: 10px;
          padding: 4px 10px;
          font-size: 11px;
        }

        .steps {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .step {
          padding: 20px;
          border-radius: 12px;
        }

        .step-title {
          font-size: 20px;
          line-height: 28px;
        }

        .step-desc {
          font-size: 15px;
          line-height: 22px;
        }

        .price-wrap {
          flex-direction: column;
          gap: 20px;
        }

        .price-box {
          width: 100%;
          padding: 24px 20px;
          border-radius: 12px;
        }

        .price-amount {
          font-size: 40px;
          line-height: 48px;
        }

        .price-label {
          font-size: 16px;
          line-height: 22px;
        }

        .faq-item {
          padding: 16px 20px;
        }

        .faq-question {
          font-size: 20px;
          line-height: 28px;
        }

        .faq-answer-content p {
          font-size: 15px;
          line-height: 22px;
        }
      }
    `,
  ],
})
export class WeightLossComponent {
  constructor() {
    inject(SeoService).setMetadata({
      title: 'Medically Supervised Weight Loss Program',
      description:
        'Start your medically supervised GLP-1 weight-loss program with Local MD. Real medication (Semaglutide or Tirzepatide), professional monitoring, and transparent pricing.',
      image: '/assets/glp1-hero-clinical.webp',
      path: '/weight-loss',
    });
  }

  protected readonly expandedFaqId = signal<string>('');

  protected readonly faqItems: FaqItem[] = [
    {
      id: 'candidate',
      question: 'Who is a good candidate for GLP-1 therapy?',
      answer:
        'Adults looking to lose weight who meet clinical criteria are often good candidates. A provider reviews your health history, current medications, and goals during your consultation to determine whether treatment is appropriate for you.',
    },
    {
      id: 'weight',
      question: 'How much weight can I expect to lose?',
      answer:
        'In clinical trials, patients lost an average of roughly 15% of their body weight with semaglutide and up to about 21% with tirzepatide at the highest dose, alongside lifestyle changes. Individual results vary and are not guaranteed.',
    },
    {
      id: 'membership',
      question: "What's included in the monthly membership?",
      answer:
        'Your membership covers your medication along with ongoing dose management and regular check-ins with your care team. The initial consultation is normally $149 but is available for $99 through September 1, 2026. Monthly membership starts at $149 per month.',
    },
    {
      id: 'side-effects',
      question: 'Are there side effects?',
      answer:
        'The most common side effects are digestive — such as nausea — and usually ease as your body adjusts, which is one reason we increase the dose gradually and monitor you throughout. Your provider will review all potential risks with you before you begin.',
    },
    {
      id: 'cancel',
      question: 'Can I cancel anytime?',
      answer:
        'Yes. The membership is month-to-month, and you can pause or cancel based on your progress and goals after speaking with your provider.',
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
