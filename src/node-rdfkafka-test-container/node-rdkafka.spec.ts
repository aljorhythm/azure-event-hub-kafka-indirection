import { KafkaContainer, type StartedKafkaContainer } from '@testcontainers/kafka'
import Kafka, { type ConsumerGlobalConfig, type ClientMetrics, type ProducerGlobalConfig, type GlobalConfig, type KafkaConsumer } from 'node-rdkafka'
import { v4 as uuid } from 'uuid'
import { sleep } from '../sleep'

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

async function publishClick (brokerList: ProducerGlobalConfig['metadata.broker.list'], msg: string): Promise<void> {
  const producer = new Kafka.Producer({
    debug: 'all',
    'client.id': clientId,
    'metadata.broker.list': brokerList
  })
  const readyProducer = new Promise<void>((resolve) => {
    producer.on('ready', () => {
      resolve()
    })
  })

  producer.connect()

  await readyProducer

  const messageKey = uuid()
  producer.produce(
    topic,
    null,
    Buffer.from(msg),
    messageKey,
    Date.now()
  )

  const disconnectProducer = new Promise<{ err: Error, data: ClientMetrics }>((resolve) => {
    producer.disconnect((err, data) => {
      resolve({ err, data })
    })
  })

  await disconnectProducer
}

describe('send event', () => {
  let kafkaContainer: StartedKafkaContainer | undefined
  let consumer: KafkaConsumer | undefined
  let broker: string | undefined

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
      await publishClick(broker, msg)
    }

    await sleep(1000)

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

    await kafkaContainer.stop()
  })
})
