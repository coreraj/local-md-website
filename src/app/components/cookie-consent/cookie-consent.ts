import { afterNextRender, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CustomWindow extends Window {
  lmdConsent?: {
    status?: string;
    onAccept?: () => void;
  };
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css',
})
export class CookieConsentComponent {
  private readonly storageKey = 'lmd-cookie-consent';
  protected isVisible = signal(false);

  constructor() {
    // Browser storage must be read after hydration so the server and client render the same DOM.
    afterNextRender(() => {
      const choice = this.getConsentChoice();
      if (choice === 'accepted') {
        this.triggerAnalytics();
      } else if (choice !== 'declined') {
        window.setTimeout(() => this.isVisible.set(true), 1000);
      }
    });
  }

  protected acceptConsent() {
    this.saveConsentChoice('accepted');
    this.isVisible.set(false);
    this.triggerAnalytics();
  }

  protected declineConsent() {
    this.saveConsentChoice('declined');
    this.isVisible.set(false);
  }

  private getConsentChoice(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  private saveConsentChoice(value: string) {
    try {
      localStorage.setItem(this.storageKey, value);
    } catch {
      return;
    }
  }

  private triggerAnalytics() {
    // If there is a global analytics init hook on the window
    const win = window as unknown as CustomWindow;
    if (win.lmdConsent) {
      win.lmdConsent.status = 'accepted';
      if (typeof win.lmdConsent.onAccept === 'function') {
        win.lmdConsent.onAccept();
      }
    }
  }
}
