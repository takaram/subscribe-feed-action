export type State = {
  idField: 'guid' | 'link' | 'pubDate';
  readIds: string[];
};

export type FeedItem = {
  [key: string]: any;
  guid?: string;
  link?: string;
  pubDate?: string;
};

export type FindNewItemsResult = {
  newItems: FeedItem[];
  newState: State;
};

export function findNewItems(
  items: FeedItem[],
  state: State
): FindNewItemsResult {
  const newItems = items.filter(item => {
    const id = item[state.idField];
    return id ? !state.readIds.includes(id) : false;
  });

  const newState = {
    ...state,
    readIds: [...state.readIds, ...newItems.map(item => item[state.idField]!)],
  };

  return { newItems, newState };
}

export function initializeState(items: FeedItem[]): State {
  if (items.length === 0) {
    throw new Error('Cannot initialize state from empty feed.');
  }
  const item = items[0];
  let idField: State['idField'];
  if ('guid' in item && item.guid) {
    idField = 'guid';
  } else if ('link' in item && item.link) {
    idField = 'link';
  } else if ('pubDate' in item && item.pubDate) {
    idField = 'pubDate';
  } else {
    throw new Error('No valid ID field found in feed items.');
  }

  return {
    idField,
    readIds: [],
  };
}
