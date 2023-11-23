import { type StoppedTestContainer } from 'testcontainers'

import { KafkaContainer, type StartedKafkaContainer } from '@testcontainers/kafka'
import Kafka, { type ConsumerGlobalConfig, type ClientMetrics, type ProducerGlobalConfig, type GlobalConfig, type KafkaConsumer } from 'node-rdkafka'
import { v4 as uuid } from 'uuid'

const topic = 'click'
const clientId = 'spike'

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
      console.log('topic created')
      resolve()
    })
  })
}

async function initConsumer (brokerList: ConsumerGlobalConfig['metadata.broker.list'], onData: (msg: string) => void): Promise<KafkaConsumer> {
  const consumer = new Kafka.KafkaConsumer({
    'group.id': clientId,
    'metadata.broker.list': brokerList
  }, {})
  console.log('connect consumer 🚀 ~ file: click.spec.ts:62')

  consumer.connect()

  consumer
    .on('ready', () => {
      console.log(`ready subscribe topic ${topic} 🚀 ~ file: click.spec.ts:62 ~ setInterval ~ consumer:`)
      consumer.subscribe([topic])
      consumer.consume()
    })
    .on('data', (data) => {
      console.log('received message found!  Contents below.', data.value?.toString())
      onData(data.value?.toString() ?? '')
    })

  return consumer
}

async function publishClick (brokerList: ProducerGlobalConfig['metadata.broker.list']): Promise<void> {
  const producer = new Kafka.Producer({
    debug: 'all',
    'client.id': clientId,
    'metadata.broker.list': brokerList
  })
  console.log('publishClick ~ trying to connect producer:', brokerList, producer.isConnected())

  const readyProducer = new Promise<void>((resolve) => {
    producer.on('ready', () => {
      resolve()
    })
  })

  producer.connect()

  await readyProducer

  console.log('🚀 ~ file: click.spec.ts:48 ~ producer.on ~ producer isConnected()', producer.isConnected())

  const messageKey = uuid()
  producer.produce(
    topic,
    null,
    Buffer.from('Awesome click'),
    messageKey,
    Date.now()
  )

  const disconnectProducer = new Promise<{ err: Error, data: ClientMetrics }>((resolve) => {
    producer.disconnect((err, data) => {
      resolve({ err, data })
    })
  })

  const { err, data } = await disconnectProducer
  console.log('🚀 ~ file: click.spec.ts:67 ~ publishClick disconnectProducer', { data, err }, producer.isConnected())
}

describe('send event', () => {
  let kafkaContainer: StartedKafkaContainer | undefined
  let consumer: KafkaConsumer | undefined
  const kafkaPort = 9093

  beforeAll(async () => {
    kafkaContainer = await new KafkaContainer()
      .withExposedPorts({ host: kafkaPort, container: kafkaPort })
      .withStartupTimeout(100000)
      .start()

    console.log(
      `🚀 ~ file: click.spec.ts:50 ~ it ~ started kafkaContainer: ${kafkaContainer.getId()}`
    )
    const port = kafkaContainer.getMappedPort(kafkaPort)
    const host = kafkaContainer.getHost()
    const broker = `${host}:${port}`
    console.log('🚀 ~ file: click.spec.ts:103 ~ beforeAll ~ broker:', broker)
    await createTopic(broker)
  })

  it('should send click', async () => {
    if (kafkaContainer === undefined) {
      fail('undefined kafkaContainer')
    }
    const port = kafkaContainer.getMappedPort(kafkaPort)
    const host = kafkaContainer.getHost()
    const broker = `${host}:${port}`

    let onDataResolve: ((value: unknown) => void) | undefined
    const dataResolver = new Promise((resolve) => { onDataResolve = resolve })
    const onData = (data: string): void => {
      console.log('🚀 ~ file: click.spec.ts:119 ~ onData ~ data:', data, 'onDataResolve', onDataResolve)
      onDataResolve?.(data)
    }
    consumer = await initConsumer(broker, onData)

    // while (true) {
    await publishClick(broker)
    // await new Promise((resolve) => setTimeout(resolve, 10000))
    // }

    const dataReceived = await dataResolver

    console.log('🚀 ~ file: click.spec.ts:104 ~ it ~ dataReceived:', dataReceived)
    expect(dataReceived).toEqual({})
  })

  afterAll(async () => {
    if (kafkaContainer === undefined) {
      return
    }
    const stoppedContainer: StoppedTestContainer =
                await kafkaContainer.stop()
    console.log(`🚀 ~ file: click.spec.ts:14 ~ it ~ stoppedContainer: ${stoppedContainer.getId()}`)

    await new Promise<void>((resolve) => {
      if (consumer !== undefined) {
        consumer.disconnect(resolve)
        return
      }
      resolve()
    })
  })
})
