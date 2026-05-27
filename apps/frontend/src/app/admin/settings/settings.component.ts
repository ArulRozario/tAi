import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../core/services/api.service';

export type AgentType = 'TRANSLATION' | 'REVIEW' | 'CHAT' | 'EMBEDDING';
export type Provider = 'GOOGLE' | 'ANTHROPIC';

export interface ModelConfig {
  id: string;
  agentType: AgentType;
  provider: Provider;
  modelName: string;
  endpoint: string | null;
  isActive: boolean;
  isDefault: boolean;
}

interface AgentCard {
  agentType: AgentType;
  label: string;
  description: string;
  provider: Provider;
  modelName: string;
  endpoint: string;
  apiKey: string;
  online: boolean | null;
  latencyMs: number | null;
  testError: string | null;
  testing: boolean;
  saving: boolean;
  logsExpanded: boolean;
  logs: string[];
  logsLoading: boolean;
  providerWarning: string | null;
}

const AGENT_META: Record<AgentType, { label: string; description: string }> = {
  TRANSLATION: { label: 'TRANSLATION agent', description: 'Translates source text to target language' },
  REVIEW:      { label: 'REVIEW agent',      description: 'Reviews translations for quality and errors' },
  CHAT:        { label: 'CHAT agent',         description: 'Powers the in-workbench AI assistant' },
  EMBEDDING:   { label: 'EMBEDDING agent',    description: 'Translation Memory indexing and retrieval' },
};

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(MessageService);

  activeTab = signal('models');
  loading = signal(true);
  loadError = signal(false);

  providerOptions = [
    { label: 'Google (Gemini)', value: 'GOOGLE' },
    { label: 'Anthropic', value: 'ANTHROPIC' },
  ];

  agents = signal<AgentCard[]>([]);

  ngOnInit() {
    this.api.getModels().subscribe({
      next: (configs: any[]) => {
        const cards: AgentCard[] = (['TRANSLATION', 'REVIEW', 'CHAT', 'EMBEDDING'] as AgentType[]).map(type => {
          const cfg = configs.find((c: any) => c.agentType === type && c.isDefault) || configs.find((c: any) => c.agentType === type);
          return {
            agentType: type,
            label: AGENT_META[type].label,
            description: AGENT_META[type].description,
            provider: cfg?.provider ?? 'GOOGLE',
            modelName: cfg?.modelName ?? '',
            endpoint: cfg?.endpoint ?? '',
            apiKey: '',
            online: null,
            latencyMs: null,
            testError: null,
            testing: false,
            saving: false,
            logsExpanded: false,
            logs: [],
            logsLoading: false,
            providerWarning: null,
          };
        });
        this.agents.set(cards);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(true);
      },
    });
  }

  retryLoad() {
    this.loadError.set(false);
    this.loading.set(true);
    this.ngOnInit();
  }

  onProviderChange(card: AgentCard) {
    if (card.agentType === 'EMBEDDING' && card.provider === 'ANTHROPIC') {
      card.providerWarning = 'Anthropic does not support embeddings. Use Google (Gemini) instead.';
    } else {
      card.providerWarning = null;
    }
    this.agents.update(a => [...a]);
  }

  testConnection(card: AgentCard) {
    card.testing = true;
    card.online = null;
    card.testError = null;
    this.agents.update(a => [...a]);

    this.api.testModelConnection({
      provider: card.provider,
      modelName: card.modelName,
      endpoint: card.endpoint || undefined,
      apiKey: card.apiKey || undefined,
    }).subscribe({
      next: (res) => {
        card.testing = false;
        card.online = res.online;
        card.latencyMs = res.latencyMs;
        card.testError = res.error ?? null;
        this.agents.update(a => [...a]);
      },
      error: () => {
        card.testing = false;
        card.online = false;
        card.testError = 'Connection failed';
        this.agents.update(a => [...a]);
      },
    });
  }

  saveConfig(card: AgentCard) {
    card.saving = true;
    this.agents.update(a => [...a]);

    this.api.updateModel(card.agentType, {
      provider: card.provider,
      modelName: card.modelName,
      endpoint: card.endpoint || undefined,
      apiKey: card.apiKey || undefined,
    }).subscribe({
      next: () => {
        card.saving = false;
        this.agents.update(a => [...a]);
        this.toast.add({ severity: 'success', summary: 'Saved', detail: `${AGENT_META[card.agentType].label} configuration saved` });
      },
      error: () => {
        card.saving = false;
        this.agents.update(a => [...a]);
        this.toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save configuration' });
      },
    });
  }

  toggleLogs(card: AgentCard) {
    card.logsExpanded = !card.logsExpanded;
    if (card.logsExpanded && card.logs.length === 0) {
      this.loadLogs(card);
    }
    this.agents.update(a => [...a]);
  }

  private loadLogs(card: AgentCard) {
    card.logsLoading = true;
    this.agents.update(a => [...a]);
    this.api.getModelLogs(card.agentType).subscribe({
      next: (res: any) => {
        card.logs = res.logs ?? [];
        card.logsLoading = false;
        this.agents.update(a => [...a]);
      },
      error: () => {
        card.logsLoading = false;
        this.agents.update(a => [...a]);
      },
    });
  }
}
