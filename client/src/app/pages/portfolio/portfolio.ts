import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  EMPLOYMENT_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
  SOCIAL_PLATFORM_LABELS,
  WORK_MODE_LABELS,
} from '../../core/labels';
import { WorkersApi, type WorkerPortfolio, type WorkerSkill } from '../../core/workers.api';
import { Card, Link, ProfileCard, ProgressBar, SectionHeader, Sidebar, type SidebarItem, Tag } from '../../shared/ui';

interface SkillGroup {
  category: string;
  label: string;
  skills: WorkerSkill[];
}

// Portafolio del trabajador: el propio en /portafolio, el de otro (público) en /perfil/:id
@Component({
  selector: 'app-portfolio',
  imports: [DatePipe, Card, Link, ProfileCard, ProgressBar, SectionHeader, Sidebar, Tag],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.scss',
})
export class Portfolio {
  private readonly workerId = inject(ActivatedRoute).snapshot.paramMap.get('id');

  protected readonly isOwn = this.workerId === null;
  protected readonly portfolio = signal<WorkerPortfolio | null>(null);
  protected readonly missing = signal(false);
  protected readonly menuOpen = signal(false);

  protected readonly sections: SidebarItem[] = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'sobre-mi', label: 'Sobre mí' },
    { id: 'experiencia', label: 'Experiencia' },
    { id: 'formacion', label: 'Formación' },
    { id: 'proyectos', label: 'Proyectos' },
    { id: 'contacto', label: 'Contacto' },
  ];

  protected readonly typeLabels = EMPLOYMENT_TYPE_LABELS;
  protected readonly modeLabels = WORK_MODE_LABELS;
  protected readonly platformLabels = SOCIAL_PLATFORM_LABELS;

  // Skills agrupadas por categoría, en el orden de SKILL_CATEGORY_LABELS
  protected readonly skillGroups = computed<SkillGroup[]>(() => {
    const skills = this.portfolio()?.skills ?? [];
    return Object.entries(SKILL_CATEGORY_LABELS)
      .map(([category, label]) => ({ category, label, skills: skills.filter((s) => s.category === category) }))
      .filter((group) => group.skills.length > 0);
  });

  constructor() {
    const api = inject(WorkersApi);
    (this.workerId ? api.get(this.workerId) : api.me()).subscribe({
      next: (portfolio) => this.portfolio.set(portfolio),
      error: () => this.missing.set(true),
    });
  }
}
