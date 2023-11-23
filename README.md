# azure-event-hub-kafka-indrection

Motivation: Write integration tests for events without using Azure Event Hub resources

Exploring [options](options.md)
1. Create a layer on top of azure sdk and pure kafka client. Requires code change in existing application.
2. Use azure sdk to directly connect to non Event Hub Kafka endpoint
3. Change client from azure sdk to pure kafka client


See [references](references.md) for readings and sources

## Set up

```bash
nvm use
pnpm i
```

## if using colima

When running `jest` if encounter `Could not find a working container runtime strategy`

```bash
source setup-colima.sh
```

## tests

```bash
pnpm run test:watch
```

```bash
pnpm run test
```

## Kafka Tools

Kafka UI

```docker run -it -p 8080:8080 -e DYNAMIC_CONFIG_ENABLED=true provectuslabs/kafka-ui```

Kafka Tool
<https://kafkatool.com/download.html/>