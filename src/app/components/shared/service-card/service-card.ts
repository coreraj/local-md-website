import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../icon/icon';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './service-card.html',
  styleUrl: './service-card.css',
})
export class ServiceCardComponent {
  icon = input.required<string>();
  title = input.required<string>();
  description = input.required<string>();
  buttonText = input<string>('Learn More');
  buttonLink = input<string>('/');
  showButton = input<boolean>(true);
}
