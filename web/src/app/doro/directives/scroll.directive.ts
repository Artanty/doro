import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appScroll]',
})
export class ScrollDirective {
  hostElement: HTMLElement | undefined;

  constructor(private element: ElementRef) {}

  @HostListener('mousemove', ['$event'])
  applyCustomScroll(mouseEvent: MouseEvent): void {
    this.hostElement = this.element.nativeElement;
    if (this.hostElement) {
      const hostElementPosition = this.hostElement.getBoundingClientRect();
      const rightEdgeWithoutScrollBar = hostElementPosition.right - 10;

      if (mouseEvent.clientX >= rightEdgeWithoutScrollBar) {
        this.hostElement?.classList.add('custom-scroll-vertical-hover');
      } else {
        this.hostElement?.classList.remove('custom-scroll-vertical-hover');
      }
    }
  }

  @HostListener('mouseout')
  removeCustomScroll(): void {
    this.hostElement?.classList.remove('custom-scroll-vertical-hover');
  }
}
