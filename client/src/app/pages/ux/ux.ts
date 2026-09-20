import { Component, signal } from '@angular/core';
import {
  Button,
  Card,
  type CardAction,
  Link,
  ProfileCard,
  ProgressBar,
  SectionHeader,
  Sidebar,
  type SidebarItem,
  Stepper,
  Tag,
  ThemeToggle,
} from '../../shared/ui';

// Scratchpad de componentes UX: muestra cada componente de shared/ui y las clases globales
@Component({
  selector: 'app-ux',
  imports: [Button, Card, Link, ProfileCard, ProgressBar, SectionHeader, Sidebar, Stepper, Tag, ThemeToggle],
  templateUrl: './ux.html',
  styleUrl: './ux.scss',
})
export class Ux {
  protected readonly menuOpen = signal(false);
  protected readonly lastAction = signal<string | null>(null);
  protected readonly wizardStep = signal(0);
  protected readonly wizardDone = signal(false);

  protected readonly sections: SidebarItem[] = [
    { id: 'botones', label: 'Botones' },
    { id: 'tags', label: 'Tags' },
    { id: 'tarjetas', label: 'Tarjetas' },
    { id: 'stepper', label: 'Stepper' },
    { id: 'perfil', label: 'Tarjeta de perfil' },
    { id: 'enlaces', label: 'Enlaces' },
    { id: 'progreso', label: 'Barra de progreso' },
    { id: 'encabezados', label: 'Encabezados' },
    { id: 'formularios', label: 'Formularios' },
    { id: 'tablas', label: 'Tablas' },
  ];

  protected readonly wizardSteps = ['Datos', 'Carta', 'Confirmar'];

  protected readonly cardActions: CardAction[] = [
    { id: 'ver', label: 'Ver' },
    { id: 'editar', label: 'Editar', variant: 'secondary' },
    { id: 'eliminar', label: 'Eliminar', variant: 'ghost' },
    { id: 'bloqueada', label: 'Deshabilitada', disabled: true },
  ];
}
