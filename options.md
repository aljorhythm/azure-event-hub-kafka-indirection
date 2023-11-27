# Options

## Approach

### 1. Ideal: Use azure sdk to directly connect to non Event Hub Kafka endpoint

minimal / no change to application code

existing application
```javascript

const { CONNECTION_STRING, EVENT_HUB } = process.env

function publish(message) {
    azureSdk.publish(CONNECTION_STRING, EVENT_HUB, message)
}

```

environments
```yaml
SIT:
    - KAFKA_CONNECTION_STRING: localhost:9090
PROD:
    - KAFKA_CONNECTION_STRING: azure.eventhub.asia
```

### 2. Change client from azure sdk to pure kafka client

existing application
```javascript
import azureSdk from 'azure-sdk'

const { CONNECTION_STRING, EVENT_HUB } = process.env

function publish(message) {
    azureSdk.publish(CONNECTION_STRING, EVENT_HUB, message)
}

```

after application
```javascript
import kafka from 'node-rdkafka'

const { CONNECTION_STRING } = process.env

function publish(message) {
    kafka.publish(CONNECTION_STRING, message)
}

```

### 3. Create a layer on top of azure sdk and pure kafka client. Requires code change in existing application

existing application
```javascript
import azureSdk from 'azure-sdk'

const { CONNECTION_STRING, EVENT_HUB } = process.env

function publish(message) {
    azureSdk.publish(CONNECTION_STRING, EVENT_HUB, message)
}

```

changed application
```javascript
import azureSdk from 'azure-sdk'
import kafka from 'node-rdkfaka'

const { CONNECTION_STRING, ENV } = process.env

function publish(message) {
    if(ENV === 'prod') {
        azureSdk.publish(CONNECTION_STRING, message)
    } else {
        kafka.publish(CONNECTION_STRING, message)
    }
}

```

### 4. Spin up Azure Event Hub on demand

Infrastructure-as-code
Costs $

## Notes

### [azure-sdk](https://github.com/Azure/azure-sdk-for-js)

## Kafka Client libraries

### node-rdkafka

<https://github.com/Blizzard/node-rdkafka/>

notes:

- have to insert wait **after** consume.on('ready'), messages published too quickly after consumer is ready won't be consumed
- used in official Azure example
- `kafkajs` really has a nicer API

### kafkajs

<https://github.com/tulios/kafkajs/>

## Standalone Kafka

### Testcontainers

- <https://testcontainers.com/modules/kafka/>
  - Testcontainers for Kafka Module <https://node.testcontainers.org/modules/kafka/>
  - Waiting for containers to start or be ready <https://java.testcontainers.org/features/startup_and_waits/>
  - <https://github.com/testcontainers/testcontainers-node>
  - Kafka servers with testcontainers in nodejs <https://blog.devgenius.io/running-kafka-servers-with-testcontainers-in-node-js-53ab2ad9d453>
  - Supported container runtimes <https://node.testcontainers.org/supported-container-runtimes/>

Notes
- No way to fix mapped ports, port randomly assigned on every test run (testcontainer instance creation)
- Unreliable container start up time (30s to 60s)
- On very first image download without cache, there are no logs so it cannot be inferred what is going on

### Docker

<https://github.com/wurstmeister/kafka-docker/>