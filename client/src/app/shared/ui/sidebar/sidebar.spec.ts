import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Sidebar } from './sidebar';

@Component({
  imports: [Sidebar],
  template: `
    <ui-sidebar [items]="items" [(open)]="open" />
    <section id="uno"></section>
    <section id="dos"></section>
  `,
})
class Host {
  items = [
    { id: 'uno', label: 'Uno' },
    { id: 'dos', label: 'Dos' },
  ];
  open = signal(true);
}

describe('Sidebar', () => {
  let notifyIntersection: IntersectionObserverCallback;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          notifyIntersection = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('should render a link per item', async () => {
    const { el } = await setup();
    const hrefs = [...el.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual(['#uno', '#dos']);
  });

  it('should close when a link is clicked', async () => {
    const { fixture, el } = await setup();
    el.querySelector('a')!.click();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should close on Escape', async () => {
    const { fixture } = await setup();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should mark the visible section as active', async () => {
    const { fixture, el } = await setup();
    const entry = { isIntersecting: true, target: el.querySelector('#dos') };
    notifyIntersection([entry as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    await fixture.whenStable();

    const current = [...el.querySelectorAll('a[aria-current="true"]')].map((a) => a.textContent?.trim());
    expect(current).toEqual(['Dos']);
  });
});
