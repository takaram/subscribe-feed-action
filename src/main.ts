import * as core from '@actions/core';
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

type State = {
  idField: 'guid' | 'link' | 'pubDate';
  readIds: string[];
};

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const feedUrl = core.getInput('feed-url');
    const stateFilePath = core.getInput('state-file-path') || './rss-state.json';

    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);

    if (feed.items.length === 0) {
      core.info('Feed contains no item');
      return;
    }

    const state = readJson(stateFilePath) ?? initializeState(feed);

    const newItems = feed.items.filter(item => {
      const id = item[state.idField];
      if (!id) {
        core.info(`Item with no ${state.idField} found, skipping`);
        return false;
      }
      return !state.readIds.includes(id);
    });

    core.setOutput('has-new-items', newItems.length > 0);
    core.setOutput('new-items', newItems);

    state.readIds.push(...newItems.map(item => item[state.idField]!));
    writeFileSync(stateFilePath, JSON.stringify(state));
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

function initializeState(feed: Parser.Output<{}>): State {
  let idField: State['idField'];
  if ('guid' in feed.items[0]) {
    idField = 'guid';
  } else if ('link' in feed.items[0]) {
    idField = 'link';
  } else if ('pubDate' in feed.items[0]) {
    idField = 'pubDate';
  } else {
    throw new Error('No valid ID field found');
  }

  return {
    idField,
    readIds: [],
  };
}

function readJson(path: string): State | null {
  if (existsSync(path)) {
    const data = readFileSync(path, 'utf-8');
    return JSON.parse(data) as State;
  }
  return null;
}
