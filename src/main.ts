import * as core from '@actions/core';
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { findNewItems, initializeState, State } from './feed.js';

export interface Dependencies {
  getInput: (name: string) => string;
  setOutput: (name: string, value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  info: (message: string) => void;
  setFailed: (message: string) => void;
  fetchFeed: (url: string) => Promise<Parser.Output<{ [key: string]: any }>>; // eslint-disable-line @typescript-eslint/no-explicit-any
  readState: (path: string) => State | null;
  writeState: (path: string, state: State) => void;
}

export async function run(deps: Dependencies): Promise<void> {
  try {
    const feedUrl = deps.getInput('feed-url');
    const stateFilePath =
      deps.getInput('state-file-path') || './rss-state.json';

    const feed = await deps.fetchFeed(feedUrl);

    if (feed.items.length === 0) {
      deps.info('Feed contains no item');
      return;
    }

    const currentState =
      deps.readState(stateFilePath) ?? initializeState(feed.items);

    const { newItems, newState } = findNewItems(feed.items, currentState);

    deps.setOutput('has-new-items', newItems.length > 0);
    deps.setOutput('new-items', newItems);

    deps.writeState(stateFilePath, newState);
  } catch (error) {
    if (error instanceof Error) {
      deps.setFailed(error.message);
    }
  }
}

export async function main(): Promise<void> {
  const parser = new Parser();
  const dependencies: Dependencies = {
    getInput: core.getInput,
    setOutput: core.setOutput,
    info: core.info,
    setFailed: core.setFailed,
    fetchFeed: async (url: string) => parser.parseURL(url),
    readState: (path: string): State | null => {
      if (existsSync(path)) {
        const data = readFileSync(path, 'utf-8');
        return JSON.parse(data) as State;
      }
      return null;
    },
    writeState: (path: string, state: State) => {
      writeFileSync(path, JSON.stringify(state));
    },
  };
  await run(dependencies);
}
