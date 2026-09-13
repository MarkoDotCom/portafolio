import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
} from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Button, Card, Link, ProfileCard, ProgressBar, SectionHeader, Sidebar, Tag, ThemeToggle],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly sections: SidebarItem[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'experiencia', label: 'Experiencia' },
    { id: 'componentes', label: 'Componentes' },
    { id: 'contacto', label: 'Contacto' },
  ];

  protected readonly menuOpen = signal(false);
}
