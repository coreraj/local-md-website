import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'urgent-care',
    loadComponent: () =>
      import('./pages/urgent-care/urgent-care').then((m) => m.UrgentCareComponent),
  },
  {
    path: 'primary-care',
    loadComponent: () =>
      import('./pages/primary-care/primary-care').then((m) => m.PrimaryCareComponent),
  },
  {
    path: 'occupational-health',
    loadComponent: () =>
      import('./pages/occupational-health/occupational-health').then(
        (m) => m.OccupationalHealthComponent,
      ),
  },
  {
    path: 'lab-diagnostics',
    loadComponent: () =>
      import('./pages/lab-diagnostics/lab-diagnostics').then((m) => m.LabDiagnosticsComponent),
  },
  {
    path: 'injury-care',
    loadComponent: () => import('./pages/injury/injury').then((m) => m.InjuryComponent),
  },
  {
    path: 'locations',
    loadComponent: () => import('./pages/locations/locations').then((m) => m.LocationsComponent),
  },
  {
    path: 'for-patients',
    loadComponent: () =>
      import('./pages/for-patients/for-patients').then((m) => m.ForPatientsComponent),
  },
  {
    path: 'careers',
    loadComponent: () => import('./pages/careers/careers').then((m) => m.CareersComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('./pages/privacy-policy/privacy-policy').then((m) => m.PrivacyPolicyComponent),
  },
  {
    path: 'terms-of-use',
    loadComponent: () =>
      import('./pages/terms-of-use/terms-of-use').then((m) => m.TermsOfUseComponent),
  },
  {
    path: 'accessibility',
    loadComponent: () =>
      import('./pages/accessibility/accessibility').then((m) => m.AccessibilityComponent),
  },
  {
    path: 'hipaa-notice',
    loadComponent: () => import('./pages/hipaa-notice/hipaa-notice').then((m) => m.HIPAAComponent),
  },
  { path: '**', redirectTo: 'home' },
];
