import { afterNextRender, Component, DestroyRef, inject, input, model, signal } from '@angular/core';

export interface SidebarItem {
  id: string;
  label: string;
}

@Component({
  selector: 'ui-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '(document:keydown.escape)': 'close()',
  },
})
export class Sidebar {
  readonly items = input.required<SidebarItem[]>();
  readonly open = model(false);

  protected readonly activeId = signal<string | undefined>(undefined);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.activeId.set(entry.target.id);
            }
          }
        },
        { rootMargin: '-40% 0px -55% 0px' },
      );

      for (const { id } of this.items()) {
        const section = document.getElementById(id);
        if (section) {
          observer.observe(section);
        }
      }

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected close(): void {
    this.open.set(false);
  }
}
