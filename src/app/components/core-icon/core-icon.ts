import { Component, computed, input } from '@angular/core';

/**
 * Small icon set used by the application shell and the eager home route.
 *
 * Keeping these common icons separate prevents the complete clinical icon
 * catalog from being compiled into the initial JavaScript bundle.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './core-icon.html',
  styleUrl: './core-icon.css',
})
export class CoreIconComponent {
  readonly name = input.required<string>();
  readonly size = input<number | string>(32);
  readonly color = input<string>('');
  readonly interactive = input<boolean>(false);

  protected readonly normalizedName = computed(() =>
    this.name()
      .toLowerCase()
      .trim()
      .replace(/[\s_]+/g, '-')
      .replace('smatphone', 'smartphone'),
  );

  protected readonly normalizedSize = computed(() => {
    const size = this.size();
    return typeof size === 'string' ? parseInt(size, 10) || 32 : size;
  });

  protected readonly wrapperClass = computed(() => {
    const classes = ['icon-wrapper'];

    if (!this.color()) {
      const name = this.normalizedName();
      const isDark = ['instagram', 'down', 'facebook', 'linkedin'].includes(name);
      classes.push(name === 'sort' ? 'color-black' : isDark ? 'color-dark' : 'color-teal');
    }

    if (this.interactive()) {
      classes.push('icon-interactive');
    }

    return classes.join(' ');
  });
}
