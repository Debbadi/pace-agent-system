import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { io, Socket } from 'socket.io-client';

interface Story {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  priority: string;
  status: string;
}

interface AgentState {
  name: string;
  role: string;
  icon: string;
  skill: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  logs: string[];
}

interface LogEntry {
  message: string;
  type: 'info' | 'success' | 'error' | 'warn';
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app">
      <!-- Sidebar: Jira Stories -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="jira-logo">J</span>
          <div>
            <div class="sidebar-title">Jira Stories</div>
            <div class="sidebar-sub">Mock Sprint Board</div>
          </div>
        </div>

        <div class="stories">
          <div
            *ngFor="let story of stories"
            class="story-card"
            [class.selected]="selectedStory?.id === story.id"
            [class.done]="completedStories.includes(story.id)"
            (click)="selectStory(story)"
          >
            <div class="story-top">
              <span class="story-id">{{ story.id }}</span>
              <span class="priority" [class]="story.priority.toLowerCase()">{{ story.priority }}</span>
            </div>
            <div class="story-title">{{ story.title }}</div>
            <div class="story-criteria">{{ story.acceptance_criteria.length }} criteria</div>
            <button
              class="run-story-btn"
              (click)="runStory(story.id, $event)"
              [disabled]="running"
            >
              {{ completedStories.includes(story.id) ? '✅ Done' : '▶ Run' }}
            </button>
          </div>
        </div>

        <button class="run-all-btn" (click)="runAll()" [disabled]="running">
          {{ running ? '⏳ Running...' : '▶▶ Run All Stories' }}
        </button>
      </aside>

      <!-- Main content -->
      <main class="main">
        <!-- Header -->
        <header class="header">
          <div>
            <h1>PACE Agent System</h1>
            <p class="tagline">Plan · Architect · Code · Evaluate</p>
          </div>
          <span class="conn-badge" [class.live]="connected">
            {{ connected ? '● Live' : '○ Offline' }}
          </span>
        </header>

        <!-- PACE Phase bar -->
        <div class="phase-bar">
          <div *ngFor="let phase of pacePhases; let i = index"
            class="phase-item"
            [class.active]="currentPhase === phase.key"
            [class.done]="isDone(phase.key)">
            <div class="phase-icon">{{ phase.icon }}</div>
            <div class="phase-name">{{ phase.key }}</div>
            <div class="phase-desc">{{ phase.desc }}</div>
          </div>
        </div>

        <!-- Story detail panel (when selected) -->
        <div *ngIf="selectedStory" class="story-detail">
          <div class="story-detail-header">
            <span class="story-id-big">{{ selectedStory.id }}</span>
            <strong>{{ selectedStory.title }}</strong>
          </div>
          <p class="story-desc">{{ selectedStory.description }}</p>
          <div class="criteria-list">
            <div *ngFor="let c of selectedStory.acceptance_criteria" class="criteria-item">
              <span class="criteria-bullet">›</span> {{ c }}
            </div>
          </div>
        </div>

        <!-- Agents -->
        <div class="agents-grid">
          <div *ngFor="let agent of agents" class="agent-card" [class]="agent.status">
            <div class="agent-header">
              <span class="agent-icon">{{ agent.icon }}</span>
              <div class="agent-info">
                <div class="agent-name">{{ agent.name }}</div>
                <div class="agent-role">{{ agent.role }}</div>
              </div>
              <span class="agent-badge">{{ agent.status }}</span>
            </div>
            <div class="skill-tag">📋 {{ agent.skill }}</div>
            <div class="agent-logs">
              <div *ngFor="let log of agent.logs" class="agent-log">{{ log }}</div>
              <div *ngIf="!agent.logs.length" class="agent-log dim">Waiting for task...</div>
            </div>
          </div>
        </div>

        <!-- Event log -->
        <div class="event-log">
          <div class="log-header">Event Log</div>
          <div class="log-body">
            <div *ngFor="let entry of eventLog" class="log-line" [class]="entry.type">
              <span class="log-time">{{ entry.time }}</span>
              <span class="log-msg">{{ entry.message }}</span>
            </div>
            <div *ngIf="!eventLog.length" class="log-line dim">No events yet. Click Run to start.</div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .app { display: flex; height: 100vh; overflow: hidden; background: #0a0a14; color: #e0e0e0; }

    /* Sidebar */
    .sidebar { width: 280px; min-width: 280px; background: #10101e; border-right: 1px solid #1e1e3a; display: flex; flex-direction: column; overflow-y: auto; }
    .sidebar-header { display: flex; align-items: center; gap: 12px; padding: 20px 16px; border-bottom: 1px solid #1e1e3a; }
    .jira-logo { background: #2563eb; color: white; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; min-width: 36px; }
    .sidebar-title { font-weight: 700; font-size: 0.95rem; color: #e0e0e0; }
    .sidebar-sub { font-size: 0.75rem; color: #6b7280; }
    .stories { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .story-card { background: #16162a; border: 1px solid #2a2a3e; border-radius: 10px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .story-card:hover { border-color: #7c3aed; }
    .story-card.selected { border-color: #7c3aed; background: #1a1a35; }
    .story-card.done { border-color: #22c55e; opacity: 0.8; }
    .story-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .story-id { font-size: 0.72rem; color: #2563eb; font-weight: 700; letter-spacing: 1px; }
    .priority { font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .priority.high { background: #7f1d1d; color: #fca5a5; }
    .priority.medium { background: #78350f; color: #fcd34d; }
    .priority.low { background: #14532d; color: #86efac; }
    .story-title { font-size: 0.85rem; font-weight: 600; color: #c4b5fd; margin-bottom: 4px; }
    .story-criteria { font-size: 0.72rem; color: #6b7280; margin-bottom: 8px; }
    .run-story-btn { width: 100%; background: #7c3aed; color: white; border: none; padding: 6px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; transition: background 0.2s; }
    .run-story-btn:hover:not(:disabled) { background: #6d28d9; }
    .run-story-btn:disabled { background: #3b3b5a; cursor: not-allowed; }
    .run-all-btn { margin: 12px; background: #7c3aed; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 0.9rem; cursor: pointer; font-weight: 600; }
    .run-all-btn:disabled { background: #3b3b5a; cursor: not-allowed; }

    /* Main */
    .main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 24px; gap: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; }
    h1 { font-size: 1.8rem; color: #7c3aed; margin: 0; }
    .tagline { color: #6b7280; font-size: 0.85rem; letter-spacing: 2px; margin-top: 2px; }
    .conn-badge { font-size: 0.85rem; color: #ef4444; padding: 6px 14px; background: #1a1a2e; border-radius: 20px; }
    .conn-badge.live { color: #22c55e; }

    /* Phase bar */
    .phase-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .phase-item { background: #16162a; border: 1px solid #2a2a3e; border-radius: 10px; padding: 12px; text-align: center; transition: all 0.3s; }
    .phase-item.active { background: #2d1b69; border-color: #7c3aed; box-shadow: 0 0 16px rgba(124,58,237,0.3); }
    .phase-item.done { background: #14532d; border-color: #22c55e; }
    .phase-icon { font-size: 1.4rem; margin-bottom: 4px; }
    .phase-name { font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; color: #9ca3af; }
    .phase-item.active .phase-name { color: #a78bfa; }
    .phase-item.done .phase-name { color: #86efac; }
    .phase-desc { font-size: 0.65rem; color: #4b5563; margin-top: 2px; }

    /* Story detail */
    .story-detail { background: #16162a; border: 1px solid #2a2a3e; border-radius: 10px; padding: 16px; }
    .story-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .story-id-big { background: #1e3a8a; color: #93c5fd; padding: 2px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; }
    .story-desc { color: #9ca3af; font-size: 0.85rem; margin-bottom: 10px; }
    .criteria-list { display: flex; flex-direction: column; gap: 4px; }
    .criteria-item { font-size: 0.82rem; color: #c4b5fd; display: flex; gap: 8px; }
    .criteria-bullet { color: #7c3aed; }

    /* Agents */
    .agents-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .agent-card { background: #16162a; border: 1px solid #2a2a3e; border-radius: 12px; padding: 16px; transition: all 0.3s; }
    .agent-card.running { border-color: #f59e0b; box-shadow: 0 0 16px rgba(245,158,11,0.2); }
    .agent-card.complete { border-color: #22c55e; }
    .agent-card.error { border-color: #ef4444; }
    .agent-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .agent-icon { font-size: 1.6rem; }
    .agent-name { font-weight: 700; color: #a78bfa; font-size: 0.95rem; }
    .agent-role { font-size: 0.72rem; color: #6b7280; }
    .agent-badge { margin-left: auto; font-size: 0.65rem; padding: 2px 10px; border-radius: 20px; background: #2a2a3e; color: #9ca3af; text-transform: uppercase; font-weight: 700; }
    .running .agent-badge { background: #78350f; color: #fcd34d; }
    .complete .agent-badge { background: #14532d; color: #86efac; }
    .error .agent-badge { background: #7f1d1d; color: #fca5a5; }
    .skill-tag { font-size: 0.72rem; color: #6b7280; margin-bottom: 8px; background: #0f0f20; padding: 3px 8px; border-radius: 4px; display: inline-block; }
    .agent-logs { font-family: monospace; font-size: 0.75rem; color: #9ca3af; max-height: 110px; overflow-y: auto; }
    .agent-log { padding: 2px 0; border-bottom: 1px solid #1a1a2e; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dim { color: #3b3b5a; font-style: italic; }

    /* Event log */
    .event-log { background: #16162a; border: 1px solid #2a2a3e; border-radius: 10px; padding: 16px; }
    .log-header { font-weight: 700; color: #a78bfa; margin-bottom: 10px; font-size: 0.9rem; }
    .log-body { max-height: 150px; overflow-y: auto; font-family: monospace; font-size: 0.78rem; display: flex; flex-direction: column; gap: 2px; }
    .log-line { display: flex; gap: 12px; }
    .log-line.success .log-msg { color: #22c55e; }
    .log-line.error .log-msg { color: #ef4444; }
    .log-line.warn .log-msg { color: #f59e0b; }
    .log-line.info .log-msg { color: #60a5fa; }
    .log-time { color: #4b5563; min-width: 75px; }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  socket!: Socket;
  connected = false;
  running = false;
  stories: Story[] = [];
  selectedStory: Story | null = null;
  completedStories: string[] = [];
  currentPhase = '';
  donePhasesSet = new Set<string>();
  eventLog: LogEntry[] = [];

  pacePhases = [
    { key: 'PLAN', icon: '📋', desc: 'Story → Card' },
    { key: 'ACT', icon: '⚡', desc: 'Build + TDD' },
    { key: 'CHECK', icon: '✅', desc: 'Commit' },
    { key: 'EVOLVE', icon: '📝', desc: 'Document' }
  ];

  phaseOrder = ['PLAN', 'ACT', 'CHECK', 'EVOLVE'];

  agents: AgentState[] = [
    { name: 'BuilderAgent', role: 'TDD Code Generator', icon: '🏗️', skill: 'builder.SKILL.md', status: 'idle', logs: [] },
    { name: 'DevOpsAgent', role: 'Git Automation', icon: '🚀', skill: 'devops.SKILL.md', status: 'idle', logs: [] },
    { name: 'ScribeAgent', role: 'Documentation', icon: '📝', skill: 'builder.SKILL.md', status: 'idle', logs: [] }
  ];

  isDone(phase: string): boolean {
    return this.donePhasesSet.has(phase);
  }

  ngOnInit() {
    this.loadStories();
    this.connectSocket();
  }

  async loadStories() {
    try {
      const res = await fetch('http://localhost:3000/api/stories');
      this.stories = await res.json();
    } catch {
      this.log('Cannot reach backend', 'error');
    }
  }

  connectSocket() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => { this.connected = true; this.log('Connected to PACE backend', 'success'); });
    this.socket.on('disconnect', () => { this.connected = false; this.log('Disconnected', 'error'); });

    this.socket.on('agent:update', (data: any) => {
      const agent = this.agents.find(a => a.name === data.agent);
      if (!agent) return;
      if (data.event === 'start') agent.status = 'running';
      if (data.event === 'complete') agent.status = 'complete';
      if (data.event === 'error') agent.status = 'error';
      const msg = data.data?.message || JSON.stringify(data.data).slice(0, 80);
      agent.logs.unshift(msg);
      if (agent.logs.length > 15) agent.logs.pop();
    });

    this.socket.on('pipeline:start', (data: any) => {
      this.running = true;
      this.donePhasesSet.clear();
      this.agents.forEach(a => { a.status = 'idle'; a.logs = []; });
      this.log(`Pipeline started: ${data.storyId}`, 'info');
    });

    this.socket.on('pipeline:phase', (data: any) => {
      const prev = this.phaseOrder.indexOf(this.currentPhase);
      if (prev >= 0) this.donePhasesSet.add(this.currentPhase);
      this.currentPhase = data.phase;
      this.log(`[${data.phase}] ${data.message}`, 'info');
    });

    this.socket.on('pipeline:complete', (data: any) => {
      this.running = false;
      this.donePhasesSet.add('EVOLVE');
      if (data.storyId) this.completedStories.push(data.storyId);
      this.log(`✅ Pipeline complete: ${data.storyId}`, 'success');
    });

    this.socket.on('pipeline:error', (data: any) => {
      this.running = false;
      this.log(`❌ Error: ${data.message}`, 'error');
    });
  }

  selectStory(story: Story) {
    this.selectedStory = story;
  }

  async runStory(storyId: string, event?: Event) {
    event?.stopPropagation();
    this.donePhasesSet.clear();
    this.currentPhase = '';
    await fetch(`http://localhost:3000/api/run/${storyId}`, { method: 'POST' });
  }

  async runAll() {
    this.donePhasesSet.clear();
    this.currentPhase = '';
    this.completedStories = [];
    await fetch('http://localhost:3000/api/run-all', { method: 'POST' });
  }

  log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    this.eventLog.unshift({ message, type, time });
    if (this.eventLog.length > 50) this.eventLog.pop();
  }

  ngOnDestroy() { this.socket?.disconnect(); }
}
