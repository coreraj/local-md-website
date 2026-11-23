import { Component, input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class HeroComponent {
  headline = input.required<string>();
  bodytext = input.required<string>();
  backgroundImage = input.required<string>();
}
