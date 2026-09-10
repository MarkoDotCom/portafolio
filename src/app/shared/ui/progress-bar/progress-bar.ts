import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBar {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
}
