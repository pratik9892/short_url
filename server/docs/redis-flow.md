# Redis in Shortly

Redis is only used for **BullMQ job queues** (not link storage).

```mermaid
flowchart LR
  ENV["Render env\nREDIS_URL"] --> CFG["redis.config.js\nREDIS_CONNECTION"]
  CFG --> IO["ioredis client\n(not a raw URL string)"]
  IO --> Q1["emailQueue.js"]
  IO --> Q2["analyticsQueue.js"]
  Q1 --> API["API\nuser.service"]
  Q2 --> API2["API\nlink.controller"]
  Q1 --> W["worker.js"]
  Q2 --> W
  API --> R[(Upstash Redis)]
  API2 --> R
  W --> R
```

| File | Purpose |
|------|---------|
| `src/config/server.config.js` | Reads env vars |
| `src/config/redis.config.js` | Builds `REDIS_CONNECTION` |
| `src/infrastructure/queue/*.js` | BullMQ queues + workers |
| `src/worker.js` | Processes jobs |
