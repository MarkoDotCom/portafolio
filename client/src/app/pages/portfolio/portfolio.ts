import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Session } from '../../core/session';
import {
  Button,
  Card,
  Link,
  ProfileCard,
  ProgressBar,
  SectionHeader,
  Sidebar,
  type SidebarItem,
  Tag,
  ThemeToggle,
} from '../../shared/ui';

@Component({
  selector: 'app-portfolio',
  imports: [RouterLink, Button, Card, Link, ProfileCard, ProgressBar, SectionHeader, Sidebar, Tag, ThemeToggle],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  protected readonly user = inject(Session).currentUser;

  protected readonly sections: SidebarItem[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'experiencia', label: 'Experiencia' },
    { id: 'componentes', label: 'Componentes' },
    { id: 'contacto', label: 'Contacto' },
  ];

  protected readonly menuOpen = signal(false);
}
