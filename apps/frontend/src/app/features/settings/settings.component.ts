import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ButtonModule, InputTextModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fade-in pb-20">
      <!-- HEADER (Slim) -->
      <header class="flex justify-between items-center px-2">
        <div class="flex flex-col">
          <h1 class="text-xl font-black text-white leading-none mb-1">System Architecture</h1>
          <div class="flex items-center gap-2">
            <span class="micro-label">Infrastructure Core v0.4.2</span>
            <div class="w-1 h-1 rounded-full bg-primary animate-pulse"></div>
          </div>
        </div>
        <div class="flex gap-3">
           <button pButton label="Factory Reset" class="p-button-text !text-slate-700 hover:!text-rose-500"></button>
           <button pButton label="Deploy Protocol" icon="pi pi-bolt" class="!bg-primary !border-none !h-9 !px-5 shadow-lg shadow-primary/10"></button>
        </div>
      </header>

      <div class="grid grid-cols-12 gap-6">
        <!-- Main Settings Column -->
        <div class="col-span-8 space-y-6">
          <!-- General Pipeline -->
          <section class="glass-card p-6 space-y-6 border-white/5">
            <div class="flex items-center gap-3 border-b border-white/5 pb-4">
              <i class="pi pi-sliders-h text-primary text-xs"></i>
              <span class="micro-label !text-white">Pipeline Directives</span>
            </div>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="flex flex-col gap-2">
                <label class="micro-label px-1">Neural Namespace</label>
                <input pInputText [(ngModel)]="workspaceName" class="glass-input !h-10 !px-4" />
              </div>
              
              <div class="flex flex-col gap-2">
                <label class="micro-label px-1">Linguistic Base</label>
                <input pInputText [(ngModel)]="primaryLang" class="glass-input !h-10 !px-4" />
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <label class="micro-label px-1">Global behavioral Overlay</label>
              <textarea class="glass-input w-full !h-24 !p-4 !text-xs leading-relaxed resize-none" 
                        placeholder="Define global behavioral constraints..."></textarea>
            </div>
          </section>

          <!-- Neural Engine Settings -->
          <section class="glass-card p-6 space-y-6 border-white/5">
            <div class="flex items-center gap-3 border-b border-white/5 pb-4">
              <i class="pi pi-cpu text-primary text-xs"></i>
              <span class="micro-label !text-white">Neural Protocols</span>
            </div>
            
            <div class="space-y-3">
              <div *ngFor="let proto of [
                {title: 'Autonomous Extraction', desc: 'Trigger OCR on artifact ingestion.', active: true, icon: 'pi-eye'},
                {title: 'Strict Enforcement', desc: 'Kill synthesis if non-compliant term is detected.', active: false, icon: 'pi-shield'}
              ]" class="flex items-center justify-between p-4 bg-slate-950/20 rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
                <div class="flex gap-4">
                  <div class="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                    <i [class]="'pi ' + proto.icon + ' text-primary text-xs'"></i>
                  </div>
                  <div>
                    <div class="font-black text-slate-200 uppercase tracking-widest text-[9px] mb-0.5">{{ proto.title }}</div>
                    <div class="text-[9px] text-slate-600 font-medium leading-relaxed">{{ proto.desc }}</div>
                  </div>
                </div>
                <button pButton [icon]="proto.active ? 'pi pi-check' : 'pi pi-times'" 
                        [class]="'!w-8 !h-8 !rounded-lg !border-none ' + (proto.active ? '!bg-emerald-500/20 !text-emerald-500' : '!bg-slate-900 !text-slate-700')"></button>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar Column -->
        <div class="col-span-4 space-y-6">
          <!-- Model Selection -->
          <section class="glass-card p-6 border-white/5 space-y-6">
            <span class="micro-label">Primary Intelligence</span>
            <div class="space-y-2">
              <div *ngFor="let model of ['tAI-Prime-v4', 'GPT-4-Turbo', 'Claude-3.5']" 
                   [class]="'p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ' + 
                            (model === 'tAI-Prime-v4' ? 'bg-primary/5 border-primary/30' : 'bg-slate-950/40 border-white/5 hover:border-white/10')">
                  <span [class]="'text-[9px] font-black uppercase tracking-widest ' + (model === 'tAI-Prime-v4' ? 'text-primary' : 'text-slate-600')">{{ model }}</span>
                  <i *ngIf="model === 'tAI-Prime-v4'" class="pi pi-check text-[8px] text-primary"></i>
              </div>
            </div>
          </section>

          <!-- Resource Usage -->
          <section class="glass-card p-6 border-white/5 space-y-4">
            <span class="micro-label">Core Load</span>
            <div class="space-y-4">
               <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[8px] font-black text-slate-600 uppercase">Tokens</span>
                    <span class="text-[8px] font-black text-slate-300">24%</span>
                  </div>
                  <div class="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                     <div class="h-full bg-primary w-[24%]"></div>
                  </div>
               </div>
               <div>
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[8px] font-black text-slate-600 uppercase">Memory</span>
                    <span class="text-[8px] font-black text-slate-300">14.2 GB</span>
                  </div>
                  <div class="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                     <div class="h-full bg-emerald-500 w-[60%]"></div>
                  </div>
               </div>
            </div>
          </section>

          <!-- Danger Zone -->
          <section class="glass-card p-6 border-rose-500/10 bg-rose-500/[0.02] space-y-4">
            <span class="micro-label !text-rose-500">Hazard Zone</span>
            <p class="text-[8px] text-slate-600 leading-relaxed font-bold uppercase tracking-widest">Wipe all neural weights and document vectors.</p>
            <button pButton label="Purge Namespace" class="w-full !bg-rose-500/10 !border-rose-500/20 !text-rose-400 !h-9"></button>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep {
      .glass-input {
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        color: #f8fafc !important;
        border-radius: 16px !important;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        &:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15) !important; background: rgba(15, 23, 42, 0.8) !important; }
      }
    }
  `]
})
export class SettingsComponent {
  workspaceName = 'LAVA_PROTO_SYNC';
  primaryLang = 'Tamil_Neural_V4';
}
