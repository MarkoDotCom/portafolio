import { TestBed } from '@angular/core/testing';
import { Ux } from './ux';

describe('Ux', () => {
  it('should render one section per sidebar item and react to card actions', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    const fixture = TestBed.createComponent(Ux);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const links = el.querySelectorAll('.ui-sidebar__link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(el.querySelector(link.getAttribute('href')!)).not.toBeNull();
    }

    el.querySelector<HTMLButtonElement>('.ui-card__actions button')!.click();
    await fixture.whenStable();
    expect(el.textContent).toContain('Última acción: ver');
  });
});
