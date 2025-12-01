# Subscribe Feed Action

[![CI](https://github.com/takaram/subscribe-feed-action/actions/workflows/ci.yml/badge.svg)](https://github.com/takaram/subscribe-feed-action/actions/workflows/ci.yml)

This GitHub Action subscribes to an RSS/Atom feed and checks for new items since the last run.

## Usage

You can use this action in your workflow to trigger jobs when a new feed item is published.

## Example Workflow

Here's an example of how to use this action to check for new items in a feed every hour:

```yaml
name: Check for new feed items

on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  check-feed:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v6

      - name: Subscribe to feed
        id: feed
        uses: takaram/subscribe-feed-action@main
        with:
          feed-url: 'https://github.blog/feed/'
          state-file-path: 'state.json'

      - name: Show new items
        if: steps.feed.outputs.has-new-items == 'true'
        env:
          NEW_ITEMS_JSON: ${{ steps.feed.outputs.new-items }}
        run: echo "$NEW_ITEMS_JSON" | jq .
```

This workflow will check the GitHub Blog feed every hour. If there are new items, it will print them to the console.

## Inputs

| Name              | Description                                                              | Required | Default            |
| ----------------- | ------------------------------------------------------------------------ | -------- | ------------------ |
| `feed-url`        | URL of the feed to subscribe to                                          | `true`   |                    |
| `state-file-path` | Path to JSON file that stores read/seen items                            | `false`  | `./rss-state.json` |

> [!CAUTION]
> This action records read articles in the file specified by `state-file-path`, but it only outputs to the file. To persist this state between workflow runs, you will need to save this file by, for example, committing it to the repository or uploading it as an artifact.

## Outputs

| Name              | Description                                |
| ----------------- | ------------------------------------------ |
| `has-new-items`   | `true` if there are new items in the feed. |
| `new-items`       | A JSON array of the new feed items.        |

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
