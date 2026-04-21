import fs from 'fs';
import path from 'path';
import { CustomClient } from '../bot/structures/CustomClient';
import { Command } from '../typings/index';
import { log } from './logger';

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      results.push(fullPath);
    }
  }
  return results;
}

export function loadCommands(client: CustomClient, commandsDir: string): void {
  const files = getAllTsFiles(commandsDir);
  for (const file of files) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command: Command = require(file);
      if (command.data && typeof command.execute === 'function') {
        client.commands.set(command.data.name, command);
        log('info', `Loaded command: ${command.data.name}`);
      }
    } catch (err) {
      log('error', `Failed to load command at ${file}: ${(err as Error).message}`);
    }
  }
}

export function loadCommandData(commandsDir: string): object[] {
  const files = getAllTsFiles(commandsDir);
  const commands: object[] = [];
  for (const file of files) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command: Command = require(file);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    } catch (err) {
      log('error', `Failed to read command data at ${file}: ${(err as Error).message}`);
    }
  }
  return commands;
}
