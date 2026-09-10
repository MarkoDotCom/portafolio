import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class Card {
  readonly title = input<string>();
}
