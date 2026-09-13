import { Component, input } from '@angular/core';
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
}
