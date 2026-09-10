import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-link',
  templateUrl: './link.html',
  styleUrl: './link.scss',
})
export class Link {
  readonly href = input.required<string>();
  readonly external = input(false);
  readonly ariaLabel = input<string>();
}
