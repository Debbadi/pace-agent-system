import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class DevOpsAgent {
  constructor(io) {
    this.io = io;
    this.name = 'DevOpsAgent';
    // Push from the root project repo, not a sub-repo
    this.repoPath = path.join(process.cwd(), '..');
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
      // Stage the generated files
      this.emit('step', { message: `📦 Staging ${filename}...` });
      await this.git(`git add backend/generated/${filename} backend/generated/${testFilename}`);

      // Commit
      this.emit('step', { message: '💾 Committing...' });
      const commitMsg = `code(${storyId}): add implementation and tests`;
      let commitHash = 'committed';
      try {
        const { stdout } = await this.git(`git commit -m "${commitMsg}"`);
        commitHash = stdout.match(/\[[\w\s]+\s([a-f0-9]+)\]/)?.[1] || 'committed';
      } catch {
        commitHash = 'already-up-to-date';
      }

      // Push to main repo
      this.emit('step', { message: '🚀 Pushing to GitHub...' });
      await this.git('git push origin main');

      this.emit('complete', {
        message: `✅ Pushed to GitHub [${commitHash}]`,
        commitHash,
        status: 'pushed'
      });

      return { status: 'pushed', commitHash, storyId };
    } catch (err) {
      this.emit('error', { message: err.message });
      throw err;
    }
  }
}
