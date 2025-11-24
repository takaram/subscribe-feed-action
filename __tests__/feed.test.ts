import { findNewItems, initializeState, FeedItem } from '../src/feed';

describe('feed.ts', () => {
  describe('initializeState', () => {
    it('should use guid as idField if present', () => {
      const items: FeedItem[] = [{ guid: '123' }];
      const state = initializeState(items);
      expect(state.idField).toBe('guid');
    });

    it('should use link as idField if guid is not present', () => {
      const items: FeedItem[] = [{ link: 'http://example.com' }];
      const state = initializeState(items);
      expect(state.idField).toBe('link');
    });

    it('should use pubDate as idField if guid and link are not present', () => {
      const items: FeedItem[] = [{ pubDate: '2025-01-01' }];
      const state = initializeState(items);
      expect(state.idField).toBe('pubDate');
    });

    it('should throw error if no valid id field is found', () => {
      const items: FeedItem[] = [{ title: 'test' }];
      expect(() => initializeState(items)).toThrow(
        'No valid ID field found in feed items.'
      );
    });

    it('should throw error for empty feed', () => {
      const items: FeedItem[] = [];
      expect(() => initializeState(items)).toThrow(
        'Cannot initialize state from empty feed.'
      );
    });
  });

  describe('findNewItems', () => {
    it('should return new items and updated state', () => {
      const items: FeedItem[] = [
        { guid: '1' },
        { guid: '2' },
        { guid: '3' },
      ];
      const state = { idField: 'guid' as const, readIds: ['1'] };

      const { newItems, newState } = findNewItems(items, state);

      expect(newItems).toEqual([{ guid: '2' }, { guid: '3' }]);
      expect(newState.readIds).toEqual(['1', '2', '3']);
    });

    it('should return no new items if all are read', () => {
      const items: FeedItem[] = [{ guid: '1' }, { guid: '2' }];
      const state = { idField: 'guid' as const, readIds: ['1', '2'] };

      const { newItems, newState } = findNewItems(items, state);

      expect(newItems).toEqual([]);
      expect(newState.readIds).toEqual(['1', '2']);
    });

    it('should handle empty initial state', () => {
      const items: FeedItem[] = [{ guid: '1' }];
      const state = { idField: 'guid' as const, readIds: [] };

      const { newItems, newState } = findNewItems(items, state);

      expect(newItems).toEqual([{ guid: '1' }]);
      expect(newState.readIds).toEqual(['1']);
    });

    it('should not include items without an id', () => {
      const items: FeedItem[] = [{ title: 'no-id' }, { guid: '123' }];
      const state = { idField: 'guid' as const, readIds: [] };

      const { newItems, newState } = findNewItems(items, state);

      expect(newItems).toEqual([{ guid: '123' }]);
      expect(newState.readIds).toEqual(['123']);
    });
  });
});
