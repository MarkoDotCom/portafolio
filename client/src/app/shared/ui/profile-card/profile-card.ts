import { Component, input, signal } from '@angular/core';
import { Card } from '../card/card';

@Component({
  selector: 'ui-profile-card',
  imports: [Card],
  templateUrl: './profile-card.html',
  styleUrl: './profile-card.scss',
})
export class ProfileCard {
  readonly imageSrc = input.required<string>();
  readonly name = input.required<string>();
  readonly subtitle = input<string>();
  /** Se usa si imageSrc no carga. */
  readonly fallbackSrc = input('avatar-placeholder.svg');

  protected readonly imageFailed = signal(false);
}
