import { Routes } from '@angular/router';
import { roleGuard } from './core/role.guard';
import { sessionGuard } from './core/session.guard';
import { CompanyJobs } from './pages/company/company-jobs/company-jobs';
import { JobApplicants } from './pages/company/job-applicants/job-applicants';
import { JobForm } from './pages/company/job-form/job-form';
import { JobDetail } from './pages/jobs/job-detail/job-detail';
import { JobList } from './pages/jobs/job-list/job-list';
import { MyApplications } from './pages/jobs/my-applications/my-applications';
import { Portfolio } from './pages/portfolio/portfolio';
import { Shell } from './pages/shell/shell';
import { UserSelect } from './pages/user-select/user-select';

export const routes: Routes = [
  { path: '', component: UserSelect, pathMatch: 'full' },
  {
    path: '',
    component: Shell,
    canActivate: [sessionGuard],
    children: [
      { path: 'portafolio', component: Portfolio },
      { path: 'ofertas', component: JobList, canActivate: [roleGuard('worker')] },
      { path: 'ofertas/:id', component: JobDetail, canActivate: [roleGuard('worker')] },
      { path: 'postulaciones', component: MyApplications, canActivate: [roleGuard('worker')] },
      { path: 'empresa/ofertas', component: CompanyJobs, canActivate: [roleGuard('employer')] },
      { path: 'empresa/ofertas/nueva', component: JobForm, canActivate: [roleGuard('employer')] },
      { path: 'empresa/ofertas/:id/postulantes', component: JobApplicants, canActivate: [roleGuard('employer')] },
    ],
  },
  { path: '**', redirectTo: '' },
];
