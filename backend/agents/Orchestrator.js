import { BuilderAgent } from './BuilderAgent.js';
import { DevOpsAgent } from './DevOpsAgent.js';
import { ScribeAgent } from './ScribeAgent.js';
import { getStories, getStory } from '../jira/mockJira.js';

export class Orchestrator {
  constructor(io) {
    this.io = io;
    this.builder = new BuilderAgent(io);
    this.devops = new DevOpsAgent(io);
    this.scribe = new ScribeAgent(io);
  }

  emit(event, data) {
    this.io.emit('pipeline:' + event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  async runStory(storyId) {
    const story = getStory(storyId);
    this.emit('start', { storyId, story, message: `PACE pipeline for ${storyId}: ${story.title}` });

    try {
      // PLAN phase
      this.emit('phase', { phase: 'PLAN', message: `Planning: ${story.title}` });

      // ACT phase - Builder (TDD)
      this.emit('phase', { phase: 'ACT', message: 'Builder Agent generating code...' });
      const buildResult = await this.builder.run(story);

      // CHECK phase - DevOps commit
      this.emit('phase', { phase: 'CHECK', message: 'DevOps Agent committing code...' });
      const devopsResult = await this.devops.run(buildResult);

      // EVOLVE phase - Scribe docs
      this.emit('phase', { phase: 'EVOLVE', message: 'Scribe Agent documenting...' });
      const scribeResult = await this.scribe.run(story, buildResult, devopsResult);

      this.emit('complete', {
        storyId,
        message: `Pipeline complete for ${storyId}`,
        buildResult,
        devopsResult
      });

      return { success: true, story, buildResult, devopsResult, scribeResult };
    } catch (err) {
      this.emit('error', { message: err.message, storyId });
      throw err;
    }
  }

  getStories() {
    return getStories();
  }
}
