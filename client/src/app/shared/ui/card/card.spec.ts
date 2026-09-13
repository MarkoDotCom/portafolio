import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card } from './card';

@Component({
  imports: [Card],
  template: `<ui-card heading="Proyecto">Contenido</ui-card>`,
})
class Host {}

describe('Card', () => {
  it('should render the heading without a native title attribute', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('ui-card')!;

    expect(card.querySelector('.ui-card__title')?.textContent).toBe('Proyecto');
    expect(card.hasAttribute('title')).toBe(false);
  });
});
