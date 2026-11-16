# Chat workspace

Messages are separated by calendar day: **Today**, **Yesterday**, then the date for older messages. Older years include the year. Hover a message time or date divider to see the full timestamp. The PHP API's US Eastern SQL timestamps are converted to the viewer's local timezone, including daylight saving changes. Day labels refresh when the page stays open past midnight or regains focus.

The workspace includes conversation timestamps, readable incoming/outgoing messages, message search, earlier-history loading, and a **Jump to latest** button. Background updates preserve your reading position and previously loaded history. Search applies to loaded messages; load earlier messages first to search further back. Replies, message receipts, editing, deletion, group membership and fullscreen controls remain available under their existing permissions.

The layout adapts to mobile and dark mode, supports keyboard focus, and respects reduced-motion preferences. Deploy the updated frontend `build/`; this change needs no SQL migration or backend deployment.

Validation:

```sh
npm test -- --watch=false --runInBand --runTestsByPath src/components/Chat/chatDates.test.js src/components/Chat/ChatWorkspace.test.js
npm run build
node scripts/verify_chat_workplace_browser.js
```

The optional Chrome browser check uses synthetic data and intercepts all API requests. It writes screenshots and results to `.server-audit/chat-workplace-browser/` without sending real messages.
