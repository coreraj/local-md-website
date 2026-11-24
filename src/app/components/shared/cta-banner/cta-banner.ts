import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-banner',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cta-banner.html',
  styleUrl: './cta-banner.css',
})
export class CtaBannerComponent {
  title = input.required<string>();
  description = input.required<string>();
  buttonText = input.required<string>();
  buttonLink = input.required<string>();
  buttonQueryParams = input<Record<string, string> | null>(null);
}
