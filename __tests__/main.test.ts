import { jest } from '@jest/globals';
import { run, Dependencies } from '../src/main';

describe('main.ts', () => {
  let deps: jest.Mocked<Dependencies>;

  beforeEach(() => {
    deps = {
      getInput: jest.fn(),
      setOutput: jest.fn(),
      info: jest.fn(),
      setFailed: jest.fn(),
      fetchFeed: jest.fn(),
      readState: jest.fn(),
      writeState: jest.fn(),
    };
  });

  it('should output new items when feed has new entries', async () => {
    // Arrange
    deps.getInput.mockImplementation(name => {
      if (name === 'feed-url') return 'http://example.com/feed.xml';
      if (name === 'state-file-path') return './state.json';
      return '';
    });
    deps.fetchFeed.mockResolvedValue({
      items: [{ guid: 'a' }, { guid: 'b' }],
    });
    deps.readState.mockReturnValue({ idField: 'guid', readIds: ['a'] });

    // Act
    await run(deps);

    // Assert
    expect(deps.setOutput).toHaveBeenCalledWith('has-new-items', true);
    expect(deps.setOutput).toHaveBeenCalledWith('new-items', [{ guid: 'b' }]);
    expect(deps.writeState).toHaveBeenCalledWith('./state.json', {
      idField: 'guid',
      readIds: ['a', 'b'],
    });
    expect(deps.setFailed).not.toHaveBeenCalled();
  });

  it('should initialize state if state file does not exist', async () => {
    // Arrange
    deps.getInput.mockReturnValue('http://example.com/feed.xml');
    deps.fetchFeed.mockResolvedValue({
      items: [{ guid: 'a' }],
    });
    deps.readState.mockReturnValue(null); // Simulate state file not found

    // Act
    await run(deps);

    // Assert
    expect(deps.setOutput).toHaveBeenCalledWith('has-new-items', true);
    expect(deps.setOutput).toHaveBeenCalledWith('new-items', [{ guid: 'a' }]);
    expect(deps.writeState).toHaveBeenCalledWith(expect.any(String), {
      idField: 'guid',
      readIds: ['a'],
    });
  });

  it('should handle no new items', async () => {
    // Arrange
    deps.getInput.mockReturnValue('http://example.com/feed.xml');
    deps.fetchFeed.mockResolvedValue({
      items: [{ guid: 'a' }],
    });
    deps.readState.mockReturnValue({ idField: 'guid', readIds: ['a'] });

    // Act
    await run(deps);

    // Assert
    expect(deps.setOutput).toHaveBeenCalledWith('has-new-items', false);
    expect(deps.setOutput).toHaveBeenCalledWith('new-items', []);
    expect(deps.writeState).toHaveBeenCalled();
  });

  it('should handle empty feed', async () => {
    // Arrange
    deps.getInput.mockReturnValue('http://example.com/feed.xml');
    deps.fetchFeed.mockResolvedValue({ items: [] });

    // Act
    await run(deps);

    // Assert
    expect(deps.info).toHaveBeenCalledWith('Feed contains no item');
    expect(deps.setOutput).not.toHaveBeenCalled();
    expect(deps.writeState).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const error = new Error('Failed to fetch feed');
    deps.getInput.mockReturnValue('http://example.com/feed.xml');
    deps.fetchFeed.mockRejectedValue(error);

    // Act
    await run(deps);

    // Assert
    expect(deps.setFailed).toHaveBeenCalledWith('Failed to fetch feed');
  });
});
