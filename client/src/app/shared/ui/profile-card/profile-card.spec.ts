import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ProfileCard } from './profile-card';

@Component({
  imports: [ProfileCard],
  template: `
    <ui-profile-card imageSrc="foto.jpg" name="Ada Lovelace" subtitle="Ingeniera">
      Texto de presentación
    </ui-profile-card>
  `,
})
class Host {}

describe('ProfileCard', () => {
  it('should render the image, name, subtitle and projected text', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('img')?.getAttribute('src')).toBe('foto.jpg');
    expect(el.querySelector('.ui-profile-card__name')?.textContent).toBe('Ada Lovelace');
    expect(el.querySelector('.ui-profile-card__subtitle')?.textContent).toBe('Ingeniera');
    expect(el.querySelector('.ui-profile-card__text')?.textContent).toContain('Texto de presentación');
  });

  it('should not render the subtitle when missing', async () => {
    const fixture = TestBed.createComponent(ProfileCard);
    fixture.componentRef.setInput('imageSrc', 'foto.jpg');
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('.ui-profile-card__subtitle')).toBeNull();
  });
});
