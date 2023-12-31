import { KafkaContainer, type StartedKafkaContainer } from '@testcontainers/kafka'
import Kafka, { type ConsumerGlobalConfig, type GlobalConfig, type KafkaConsumer } from 'node-rdkafka'
import { type NodeRdkafkaAdaptor, newNodeRdkafkaAdaptor } from './node-rdkafka-adaptor'
import { clientId, topic } from './clicks-kafka-config'
import { Clicks } from './clicks'
import { sleep } from '../sleep'
import { newAzureSDKAdaptor, type AzureSdkAdaptor } from './azure-sdk-adaptor'

async function createTopic (brokerList: GlobalConfig['metadata.broker.list']): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const client = Kafka.AdminClient.create({
      'client.id': clientId,
      'metadata.broker.list': brokerList
    })
    client.createTopic({
      topic,
      num_partitions: 1,
      replication_factor: 1
    }, (err) => {
      if (err !== null && err !== undefined) { reject(err); return }
      resolve()
    })
  })
}

async function initConsumer (brokerList: ConsumerGlobalConfig['metadata.broker.list'], onData: (msg: string) => void): Promise<KafkaConsumer> {
  const consumer = new Kafka.KafkaConsumer({
    'group.id': clientId,
    'metadata.broker.list': brokerList
  }, {})

  consumer.on('data', (data) => {
    onData(data.value?.toString() ?? '')
  }).on('event.log', (err) => {
    console.log('error', err)
  }).on('disconnected', () => {
    console.log('disconnected')
  })

  const ready = new Promise<void>((resolve) => {
    consumer
      .on('ready', () => {
        consumer.subscribe([topic])
        consumer.consume()
        sleep(5000).then(resolve).catch(console.error)
      })
  })

  consumer.connect()

  await ready

  return consumer
}

describe('send event using node-rdkafka', () => {
  let kafkaContainer: StartedKafkaContainer | undefined
  let consumer: KafkaConsumer | undefined
  let broker: string | undefined
  let clicks: Clicks
  let clicksEventsAdaptor: NodeRdkafkaAdaptor
  const kafkaPort = 9093

  beforeAll(async () => {
    kafkaContainer = await new KafkaContainer()
      .withExposedPorts({ host: kafkaPort, container: kafkaPort })
      .withStartupTimeout(100000)
      .start()

    const port = kafkaContainer.getMappedPort(kafkaPort)
    const host = kafkaContainer.getHost()
    broker = `${host}:${port}`
    await createTopic(broker)

    clicksEventsAdaptor = await newNodeRdkafkaAdaptor({ brokerList: broker, clientId, topic })
    clicks = new Clicks(clicksEventsAdaptor)
  })

  it('should send click', async () => {
    if (kafkaContainer === undefined) {
      fail('undefined kafkaContainer')
    }

    const msgs = ['one', 'two', 'three']

    const msgsReceived: string[] = []
    const onData = (data: string): void => {
      msgsReceived.push(data)
    }
    consumer = await initConsumer(broker, onData)

    for (const msg of msgs) {
      await clicks.publishClick(msg)
    }

    await sleep(5000)

    expect(msgsReceived).toEqual(msgs)
  })

  afterAll(async () => {
    if (kafkaContainer === undefined) {
      return
    }

    await new Promise<void>((resolve) => {
      if (consumer !== undefined) {
        consumer.disconnect(resolve)
        return
      }
      resolve()
    })

    await clicksEventsAdaptor.disconnect()

    await kafkaContainer.stop()
  })
})

describe('send event using azure-sdk', () => {
  let kafkaContainer: StartedKafkaContainer | undefined
  let consumer: KafkaConsumer | undefined
  let broker: string | undefined
  let clicks: Clicks
  let clicksEventsAdaptor: AzureSdkAdaptor
  const kafkaPort = 9093

  beforeAll(async () => {
    kafkaContainer = await new KafkaContainer()
      .withExposedPorts({ host: kafkaPort, container: kafkaPort })
      .withStartupTimeout(100000)
      .start()

    const port = kafkaContainer.getMappedPort(kafkaPort)
    const host = kafkaContainer.getHost()
    broker = `${host}:${port}`
    await createTopic(broker)

    clicksEventsAdaptor = await newAzureSDKAdaptor(broker, topic)
    clicks = new Clicks(clicksEventsAdaptor)
  })

  it('should send click', async () => {
    if (kafkaContainer === undefined) {
      fail('undefined kafkaContainer')
    }

    const msgs = ['one', 'two', 'three']

    const msgsReceived: string[] = []
    const onData = (data: string): void => {
      msgsReceived.push(data)
    }
    consumer = await initConsumer(broker, onData)

    for (const msg of msgs) {
      await clicks.publishClick(msg)
    }

    await sleep(5000)

    expect(msgsReceived).toEqual(msgs)
  })

  afterAll(async () => {
    if (kafkaContainer === undefined) {
      return
    }

    await new Promise<void>((resolve) => {
      if (consumer !== undefined) {
        consumer.disconnect(resolve)
        return
      }
      resolve()
    })

    await clicksEventsAdaptor.disconnect()

    await kafkaContainer.stop()
  })
})
