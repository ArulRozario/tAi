
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { Calendar } from 'primeng/calendar';
import { Dropdown } from 'primeng/dropdown';
import { TabMenu } from 'primeng/tabmenu';
import { FileUpload } from 'primeng/fileupload';
import { AvatarModule } from 'primeng/avatar';
import { FormsModule } from '@angular/forms';
import { ApiService, Project } from '../../core/services/api.service';
import { UiService } from '../../core/services/ui.service';

interface Document {
  id: string;
  title: string;
  size: string;
  type: 'PDF' | 'DOC' | 'TXT';
  dateModified: string;
  status: 'Processing' | 'Complete' | 'Declined';
  executedBy: {
    name: string;
    email: string;
    avatar: string;
  };
}

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, TableModule, ButtonModule, TagModule, 
    InputTextModule, Calendar, Dropdown, TabMenu, FileUpload, AvatarModule, FormsModule
  ],
  template: `
    <div class="flex flex-col gap-6 animate-fade-in">
      <!-- HEADER SECTION -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 leading-tight">Documents</h1>
          <p class="text-sm text-slate-500 mt-1">Documents and attachments are uploaded as part of your project.</p>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <span class="text-slate-400">Show documents for</span>
          <p-calendar [(ngModel)]="dateRange" selectionMode="range" [readonlyInput]="true" 
                      class="compact-calendar" placeholder="Select dates"></p-calendar>
          <span class="text-slate-400">including</span>
          <p-dropdown [options]="countries" [(ngModel)]="selectedCountry" 
                      class="compact-dropdown" placeholder="All countries"></p-dropdown>
        </div>
      </div>

      <!-- CONTROL RAIL -->
      <div class="flex items-center justify-between border-b border-slate-200">
        <p-tabMenu [model]="categories"></p-tabMenu>
        <div class="flex items-center gap-2">
          <div class="relative">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input type="text" placeholder="Search" 
                   class="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary" 
                   [(ngModel)]="searchTerm" />
          </div>
          <button pButton icon="pi pi-filter" class="p-button-text !text-slate-600 !p-2"></button>
        </div>
      </div>

      <!-- UPLOAD ZONE -->
      <div class="upload-zone border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
        <div class="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm mb-3">
          <i class="pi pi-upload text-slate-600"></i>
        </div>
        <div class="text-sm">
          <span class="font-semibold text-slate-900">Click to upload</span> 
          <span class="text-slate-500"> or drag and drop</span>
        </div>
        <div class="text-xs text-slate-400 mt-1">DOC, PDF, TXT (max. 25MB)</div>
      </div>

      <!-- DATA TABLE -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-bottom border-slate-200 flex justify-between items-center bg-slate-50/30">
          <span class="text-sm font-semibold text-slate-700">All documents</span>
          <button pButton icon="pi pi-ellipsis-v" class="p-button-text !text-slate-400 !p-1"></button>
        </div>
        
        <p-table [value]="filteredDocs" responsiveLayout="scroll" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th class="w-[30%] text-left">Title</th>
              <th class="text-left">Size</th>
              <th class="text-left">Document type</th>
              <th class="text-left">Date modified</th>
              <th class="text-left">Status</th>
              <th class="text-left">Executed by</th>
              <th class="text-right">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-doc>
            <tr class="hover:bg-slate-50 transition-colors cursor-pointer">
              <td>
                <div class="flex items-center gap-3">
                  <p-checkbox [binary]="true"></p-checkbox>
                  <div class="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 mr-2">
                    <i class="pi pi-file"></i>
                  </div>
                  <span class="text-sm font-medium text-slate-700">{{ doc.title }}</span>
                </div>
              </td>
              <td class="text-sm text-slate-500">{{ doc.size }}</td>
              <td>
                <p-tag [value]="doc.type" [severity]="getTagSeverity(doc.type)" 
                       class="!text-[10px] !px-2 !py-0.5 !rounded-full"></p-tag>
              </td>
              <td class="text-sm text-slate-500">{{ doc.dateModified }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full" [style.backgroundColor]="getStatusColor(doc.status)"></div>
                  <span class="text-sm text-slate-600">{{ doc.status }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <p-avatar [image]="doc.executedBy.avatar" shape="circle" size="small"></p-avatar>
                  <div class="flex flex-col">
                    <span class="text-xs font-medium text-slate-900 leading-none">{{ doc.executedBy.name }}</span>
                    <span class="text-[10px] text-slate-400 leading-tight">{{ doc.executedBy.email }}</span>
                  </div>
                </div>
              </td>
              <td class="text-right">
                <div class="flex justify-end gap-1">
                  <button pButton icon="pi pi-copy" class="p-button-text !p-1 !text-slate-400"></button>
                  <button pButton icon="pi pi-download" class="p-button-text !p-1 !text-slate-400"></button>
                  <button pButton icon="pi pi-trash" class="p-button-text !p-1 !text-slate-400"></button>
                  <button pButton icon="pi pi-pencil" class="p-button-text !p-1 !text-slate-400"></button>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>
  `,
  styles: [`
    .compact-calendar, .compact-dropdown {
      width: 200px !important;
    }
    :host ::ng-deep {
      .p-tabmenu .p-tabmenu-nav {
        border: none !important;
      }
      .p-tabmenu .p-menuitem-link {
        background: transparent !important;
        border: none !important;
        color: var(--text-color-secondary) !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        transition: color 0.2s !important;
        padding: 0.75rem 1rem !important;
      }
      .p-tabmenu .p-menuitem-link.p-highlight {
        color: var(--primary-color) !important;
        border-bottom: 2px solid var(--primary-color) !important;
      }
      .p-datatable-sm .p-datatable-thead > tr > th {
        background: transparent !important;
        color: #94a3b8 !important;
        font-weight: 600 !important;
        font-size: 0.75rem !important;
        text-transform: uppercase !important;
        letter-spacing: 0.05em !important;
        border-bottom: 1px solid #e2e8f0 !important;
        padding: 0.75rem !important;
      }
      .p-datatable-sm .p-datatable-tbody > tr > td {
        padding: 0.75rem !important;
        border-bottom: 1px solid #f1f5f9 !important;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);
  
  dateRange: Date[] = [];
  selectedCountry: string = 'All countries';
  searchTerm = '';
  
  countries = ['All countries', 'USA', 'UK', 'Germany', 'France', 'Japan'];
  
  categories = [
    { label: 'All documents 15', icon: 'pi pi-fw pi-file', routerLink: '#' },
    { label: 'Receipts 2', icon: 'pi pi-fw pi-receipt', routerLink: '#' },
    { label: 'Contracts 4', icon: 'pi pi-fw pi-file-pdf', routerLink: '#' },
    { label: 'Others 3', icon: 'pi pi-fw pi-file', routerLink: '#' },
    { label: 'Pre-categorized 2', icon: 'pi pi-fw pi-tag', routerLink: '#' },
  ];

  docs: Document[] = [
    {
      id: '1',
      title: 'Cover letter 2022.pdf',
      size: '12Mb',
      type: 'PDF',
      dateModified: 'Aug 27, 2022',
      status: 'Processing',
      executedBy: { name: 'Tran Huynh', email: 'huynhtran@hotmail.com', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/amyelsner.png' }
    },
    {
      id: '2',
      title: 'Patient history 2022.pdf',
      size: '2Mb',
      type: 'DOC',
      dateModified: 'Mar 02, 2021',
      status: 'Complete',
      executedBy: { name: 'Josh Hernandez', email: 'josh59@hotmail.com', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/annasophia.png' }
    },
    {
      id: '3',
      title: 'SAE Notification.pdf',
      size: '17Mb',
      type: 'PDF',
      dateModified: 'Mar 22, 2021',
      status: 'Complete',
      executedBy: { name: 'Sarah Wang', email: 'sarahwang@west.biz', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/carolyn.png' }
    },
    {
      id: '4',
      title: 'Cover letter 2022.pdf',
      size: '8Mb',
      type: 'PDF',
      dateModified: 'Feb 10, 2022',
      status: 'Declined',
      executedBy: { name: 'Lan Nguyen', email: 'lan12nguyen@gmail.com', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/esteban.png' }
    },
    {
      id: '5',
      title: 'Receipt 12jan.pdf',
      size: '121Kb',
      type: 'TXT',
      dateModified: 'Apr 09, 2022',
      status: 'Complete',
      executedBy: { name: 'Loc Du', email: 'locdu12@wehner.com', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/kevin.png' }
    },
    {
      id: '6',
      title: 'Study introduction.pdf',
      size: '9Mb',
      type: 'DOC',
      dateModified: 'Sep 27, 2022',
      status: 'Complete',
      executedBy: { name: 'Giring Furqon', email: 'giringfurqon@gmail.com', avatar: 'https://primefaces.org/cdn/primeng/images/demo/avatar/lara.png' }
    },
  ];

  ngOnInit() {}

  get filteredDocs() {
    return this.docs.filter(d => d.title.toLowerCase().includes(this.searchTerm.toLowerCase()));
  }

  getTagSeverity(type: string): any {
    switch(type) {
      case 'PDF': return 'success';
      case 'DOC': return 'info';
      case 'TXT': return 'warning';
      default: return 'info';
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'Processing': return '#6366f1';
      case 'Complete': return '#10b981';
      case 'Declined': return '#ef4444';
      default: return '#94a3b8';
    }
  }
}
