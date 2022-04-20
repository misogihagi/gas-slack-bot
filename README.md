# gas-slack-bot

# setup
delete line ./node_modules/typescript/lib/lib.dom.d.ts:329

due to
https://github.com/DefinitelyTyped/DefinitelyTyped/issues/32585

# recommend
npm install -g clasp

# build
clasp login
clasp create --type Spreadsheet
clasp pull
npm run build
clasp push
clasp deploy

refs:
- https://zenn.dev/hotaka_noda/articles/4a6f0ccee73a18

# preparation for slack

Activate Incoming Webhooks
Enable Events

app_mentions:read
incoming-webhook

