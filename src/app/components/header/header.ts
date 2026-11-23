import {
  Component,
  signal,
  inject,
  LOCALE_ID,
  computed,
  HostListener,
  HostBinding,
  effect,
  ElementRef,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CoreIconComponent } from '../core-icon/core-icon';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CoreIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent {
  private readonly localeId = inject(LOCALE_ID);
  private readonly elementRef = inject(ElementRef);

  protected readonly saveMySpotUrl = environment.links.saveMySpot;
  protected readonly payBillUrl = environment.links.payBill;
  protected readonly testResultsUrl = environment.links.testResults;

  @HostBinding('class.mobile-menu-active')
  get isMobileMenuActive(): boolean {
    return this.isMobileMenuOpen();
  }

  isExternalLink(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  constructor() {
    effect(() => {
      if (typeof document !== 'undefined') {
        if (this.isMobileMenuOpen()) {
          document.body.classList.add('no-scroll');
        } else {
          document.body.classList.remove('no-scroll');
        }
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const width = (event.target as Window).innerWidth;
    if (width > 980) {
      this.closeMobileMenu();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (typeof document !== 'undefined') {
      const langDropdown = this.elementRef.nativeElement.querySelector('.lang-dropdown');
      if (langDropdown && !langDropdown.contains(event.target as Node)) {
        this.isLangDropdownOpen.set(false);
      }
      const payBillDropdowns = this.elementRef.nativeElement.querySelectorAll('.pay-bill-dropdown');
      let clickedInside = false;
      payBillDropdowns.forEach((dropdown: Element) => {
        if (dropdown.contains(event.target as Node)) {
          clickedInside = true;
        }
      });
      if (!clickedInside) {
        this.isPayBillMenuOpen.set(false);
      }
    }
  }

  // Mobile menu visibility
  protected readonly isMobileMenuOpen = signal(false);

  // Pay Bill dropdown state
  protected readonly isPayBillMenuOpen = signal(false);

  // Language state (English/Spanish dropdown) computed from LOCALE_ID
  protected readonly currentLang = computed(() => {
    const locale = this.localeId.toLowerCase();
    if (locale.startsWith('es')) {
      return { code: 'es', name: 'Español', flag: 'spanish' };
    }
    return { code: 'en', name: 'English', flag: 'english' };
  });

  protected readonly isLangDropdownOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  togglePayBillMenu(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isPayBillMenuOpen.update((open) => !open);
  }

  closePayBillMenu(): void {
    this.isPayBillMenuOpen.set(false);
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen.update((open) => !open);
  }

  selectLanguage(lang: 'en' | 'es'): void {
    // Save language selection to a cookie for active switching on the server-side (Nginx)
    document.cookie = `lang=${lang};path=/;max-age=31536000;SameSite=Lax`;

    const currentUrl = window.location.href;
    const currentPath = window.location.pathname;

    if (lang === 'en') {
      if (currentPath.includes('/es/')) {
        window.location.href = currentUrl.replace('/es/', '/en/');
      } else {
        const hasEs = currentPath.startsWith('/es/');
        if (hasEs) {
          window.location.href = window.location.origin + currentPath.replace('/es/', '/en/');
        }
      }
    } else {
      if (currentPath.includes('/en/')) {
        window.location.href = currentUrl.replace('/en/', '/es/');
      } else {
        const hasEs = currentPath.startsWith('/es/');
        if (!hasEs) {
          const hasEn = currentPath.startsWith('/en/');
          const targetPath = hasEn ? currentPath.replace('/en/', '/es/') : '/es' + currentPath;
          window.location.href = window.location.origin + targetPath;
        }
      }
    }
    this.isLangDropdownOpen.set(false);
  }
}
