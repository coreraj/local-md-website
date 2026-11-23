import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class IconComponent {
  /** The name of the icon to render (supports space, hyphen, underscore, and mixed casing) */
  name = input.required<string>();

  /** The size of the icon in pixels (defaults to 32px; automatically scales height for flags) */
  size = input<number | string>(32);

  /** A custom color value (e.g., CSS color, hex, oklch, etc.). If blank, uses Figma category defaults. */
  color = input<string>('');

  /** Adds subtle interactive scaling/animations on hover */
  interactive = input<boolean>(false);

  /** Normalizes the icon name for robust matching and maps common typos */
  protected readonly normalizedName = computed(() => {
    return this.name()
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-') // Normalize spaces and underscores to hyphens
      .replace('smatphone', 'smartphone'); // Auto-correct Figma export typo!
  });

  /** Normalizes the numeric size value */
  protected readonly normalizedSize = computed(() => {
    const s = this.size();
    return typeof s === 'string' ? parseInt(s, 10) || 32 : s;
  });

  /** Computes the height dynamically: maintains 3:2 aspect ratio for flags, otherwise square */
  protected readonly normalizedHeight = computed(() => {
    const name = this.normalizedName();
    const size = this.normalizedSize();
    if (name === 'english' || name === 'spanish') {
      return Math.round((size * 20) / 30); // 30:20 (3:2) flag proportions
    }
    return size;
  });

  /** Assigns appropriate CSS classes for grid layout, category styling, and interactive effects */
  protected readonly wrapperClass = computed(() => {
    const name = this.normalizedName();
    const isFlag = name === 'english' || name === 'spanish';

    const classes = [isFlag ? 'flag-wrapper' : 'icon-wrapper'];

    // Default category color mappings from Figma if no custom color is supplied
    if (!this.color()) {
      if (name === 'sort') {
        classes.push('color-black');
      } else if (['instagram', 'down', 'up', 'facebook', 'linkedin'].includes(name)) {
        classes.push('color-dark');
      } else if (!isFlag) {
        classes.push('color-teal');
      }
    }

    if (this.interactive()) {
      classes.push('icon-interactive');
    }

    return classes.join(' ');
  });
}
