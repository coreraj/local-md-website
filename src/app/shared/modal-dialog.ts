import { afterNextRender, DestroyRef, Directive, ElementRef, inject, output } from '@angular/core';

@Directive({
  selector: '[appModalDialog]',
  host: {
    '(cancel)': 'onCancel($event)',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ModalDialog {
  readonly dismiss = output<void>();
  private readonly dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private returnFocusTo = this.dialog.ownerDocument.activeElement as HTMLElement | null;
  private hasOpened = false;

  constructor() {
    // Native modal dialogs contain focus and make the rest of the document inert.
    // This callback is browser-only, so prerendering never calls DOM dialog APIs.
    afterNextRender(() => {
      if (!this.returnFocusTo?.isConnected) {
        this.returnFocusTo = this.dialog.ownerDocument.activeElement as HTMLElement | null;
      }
      this.dialog.showModal();
      this.hasOpened = true;
      this.dialog.querySelector<HTMLElement>('[data-modal-initial-focus]')?.focus();
    });
    inject(DestroyRef).onDestroy(() => {
      // Close before removal so the browser returns focus to the opening control.
      if (!this.hasOpened) return;
      if (this.dialog.open) this.dialog.close();
      if (this.returnFocusTo?.isConnected) this.returnFocusTo.focus();
    });
  }

  protected onCancel(event: Event): void {
    event.preventDefault();
    this.dismiss.emit();
  }

  protected onClick(event: MouseEvent): void {
    if (event.target === this.dialog) this.dismiss.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const controls = [
      ...this.dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]',
      ),
    ].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        element.getClientRects().length > 0,
    );
    const first = controls[0];
    const last = controls.at(-1);
    const active = this.dialog.ownerDocument.activeElement;
    if (!first || !last) {
      event.preventDefault();
      this.dialog.focus();
    } else if (event.shiftKey && (active === first || active === this.dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
