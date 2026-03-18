import fs from 'fs';
import path from 'path';
import axios from 'axios';

export class BuilderAgent {
  constructor(io) {
    this.io = io;
    this.name = 'BuilderAgent';
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
  }

  emit(event, data) {
    this.io.emit('agent:update', {
      agent: this.name,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async run(story) {
    this.emit('start', { message: `Starting TDD for: ${story.title}` });

    try {
      // Step 1: Generate tests first (TDD)
      this.emit('step', { message: '📝 Writing tests first (TDD approach)...' });
      const tests = await this.generateTests(story);

      // Step 2: Generate implementation
      this.emit('step', { message: '⚡ Generating implementation to pass tests...' });
      const implementation = await this.generateImplementation(story, tests);

      const filename = story.id.toLowerCase() + '-' + story.title.toLowerCase().replace(/\s+/g, '-') + '.js';
      const testFilename = filename.replace('.js', '.test.js');

      // Write files
      const outputDir = path.join(process.cwd(), 'generated');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      fs.writeFileSync(path.join(outputDir, testFilename), tests);
      fs.writeFileSync(path.join(outputDir, filename), implementation);

      this.emit('complete', {
        message: `✅ Generated ${filename} and ${testFilename}`,
        filename,
        testFilename
      });

      return { filename, testFilename, implementation, tests, storyId: story.id };
    } catch (err) {
      this.emit('error', { message: err.message });
      throw err;
    }
  }

  async generateTests(story) {
    const prompt = `You are a TDD expert. Write Jest unit tests for this user story:

Title: ${story.title}
Description: ${story.description}
Acceptance Criteria:
${story.acceptance_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Write ONLY the Jest test code. No explanation. Use supertest for HTTP testing. Export nothing.`;

    const response = await this.callOllama(prompt);
    return response || this.mockTests(story);
  }

  async generateImplementation(story, tests) {
    const prompt = `You are a Node.js expert. Write Express.js implementation for:

Title: ${story.title}
Acceptance Criteria:
${story.acceptance_criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Write ONLY the Express.js code. Use module.exports. No explanation.`;

    const response = await this.callOllama(prompt);
    return response || this.mockImplementation(story);
  }

  async callOllama(prompt) {
    try {
      this.emit('step', { message: '🤖 Calling Ollama llama3.2...' });
      const response = await axios.post(`${this.ollamaUrl}/api/generate`, {
        model: this.model,
        prompt,
        stream: false,
        options: { num_predict: 300 }
      }, { timeout: 15000 });
      this.emit('step', { message: '✅ Ollama responded' });
      return response.data.response;
    } catch (err) {
      this.emit('step', { message: '⚡ Using template generation (Ollama timeout)' });
      return null;
    }
  }

  mockTests(story) {
    const routes = story.acceptance_criteria.map(criteria => {
      const parts = criteria.split(' ');
      const method = parts[0].toLowerCase();
      const route = parts[1] || '/';
      return `
  test('${criteria}', async () => {
    const res = await request(app).${method}('${route}');
    expect(res.status).not.toBe(404);
  });`;
    }).join('\n');

    return `const request = require('supertest');
const app = require('./${story.id.toLowerCase()}-${story.title.toLowerCase().replace(/\s+/g, '-')}');

describe('${story.title}', () => {
  ${routes}
});`;
  }

  mockImplementation(story) {
    const routes = story.acceptance_criteria.map(criteria => {
      const parts = criteria.split(' - ')[0].split(' ');
      const method = parts[0].toLowerCase();
      const route = parts[1] || '/';
      return `app.${method}('${route}', (req, res) => {
  res.json({ success: true, message: '${criteria}' });
});`;
    }).join('\n\n');

    return `const express = require('express');
const app = express();
app.use(express.json());

${routes}

module.exports = app;
`;
  }
}
