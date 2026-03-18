import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export class DevOpsAgent {
  constructor(io) {
    this.io = io;
    this.name = 'DevOpsAgent';
    this.repoPath = path.join(process.cwd(), 'generated');
    this.token = process.env.GITHUB_TOKEN;
    this.repoUrl = process.env.GITHUB_REPO;
  }

  emit(event, data) {
    this.io.emit('agent:update', {
      agent: this.name,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async git(cmd) {
    return execAsync(cmd, { cwd: this.repoPath, timeout: 15000 });
  }

  async run({ filename, testFilename, storyId }) {
    this.emit('start', { message: `Committing code for ${storyId}...` });

    try {
      // Ensure generated dir exists
      if (!fs.existsSync(this.repoPath)) fs.mkdirSync(this.repoPath, { recursive: true });

      // Init repo if needed
      const isRepo = await this.git('git rev-parse --is-inside-work-tree').catch(() => null);
      if (!isRepo) {
        await this.git('git init');
        await this.git('git config user.email "pace@agent.local"');
        await this.git('git config user.name "PACE Agent"');

        // Set remote with token embedded
        const remoteUrl = this.repoUrl.replace('https://', `https://${this.token}@`);
        await this.git(`git remote add origin ${remoteUrl}`);
        this.emit('step', { message: '📁 Git repo initialized with remote' });
      }

      // Stage files
      this.emit('step', { message: `📦 Staging ${filename}...` });
      await this.git(`git add "${filename}" "${testFilename}"`);

      // Commit
      this.emit('step', { message: '💾 Committing...' });
      const commitMsg = `code(${storyId}): add implementation and tests`;
      let commitHash = 'committed';
      try {
        const { stdout } = await this.git(`git commit -m "${commitMsg}"`);
        commitHash = stdout.match(/\[[\w\s]+\s([a-f0-9]+)\]/)?.[1] || 'committed';
      } catch {
        // nothing new to commit
      }

      // Push
      this.emit('step', { message: '🚀 Pushing to GitHub...' });
      try {
        await this.git('git push -u origin master --force');
        this.emit('complete', {
          message: `✅ Pushed to GitHub [${commitHash}]`,
          commitHash,
          status: 'pushed'
        });
      } catch (pushErr) {
        // try main branch
        try {
          await this.git('git push -u origin main --force');
          this.emit('complete', {
            message: `✅ Pushed to GitHub [${commitHash}]`,
            commitHash,
            status: 'pushed'
          });
        } catch {
          this.emit('complete', {
            message: `✅ Committed locally [${commitHash}]`,
            commitHash,
            status: 'committed'
          });
        }
      }

      return { status: 'pushed', commitHash, storyId };
    } catch (err) {
      this.emit('error', { message: err.message });
      throw err;
    }
  }
}
