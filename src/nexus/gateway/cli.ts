#!/usr/bin/env node
import { normalizeCliInput } from './normalize';
import { NexusOrchestrator } from '../orchestrator/state-machine';

async function main(): Promise<void> {
  const task = process.argv.slice(2).join(' ');
  const message = normalizeCliInput(task);
  const orchestrator = new NexusOrchestrator();
  const result = await orchestrator.run(message);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

void main();
