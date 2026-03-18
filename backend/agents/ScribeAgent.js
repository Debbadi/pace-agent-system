import fs from 'fs';
import path from 'path';

export class ScribeAgent {
  constructor(io) {
    this.io = io;
    this.name = 'ScribeAgent';
  }

  emit(event, data) {
    this.io.emit('agent:update', {
      agent: this.name,
      event,
      data,
      timestamp: new Date().toISOString()
    });
  }

  async run(story, buildResult, devopsResult) {
    this.emit('start', { message: 'Generating documentation...' });

    const outputDir = path.join(process.cwd(), 'generated');
    const handoff = `# PACE Handoff — ${story.id}

## Story
**${story.title}**
${story.description}

## Acceptance Criteria
${story.acceptance_criteria.map(c => `- ${c}`).join('\n')}

## PACE Chain
| Agent | Status | Output |
|-------|--------|--------|
| BuilderAgent | ✅ Complete | ${buildResult.filename}, ${buildResult.testFilename} |
| DevOpsAgent | ✅ Complete | Commit: ${devopsResult.commitHash} |
| ScribeAgent | ✅ Complete | This document |

Generated: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(outputDir, `${story.id}-HANDOFF.md`), handoff);

    this.emit('complete', { message: `📄 Handoff doc written: ${story.id}-HANDOFF.md` });
    return { handoff };
  }
}
