import { type StoppedTestContainer } from 'testcontainers'

import { KafkaContainer, type StartedKafkaContainer } from '@testcontainers/kafka'
import Kafka, { type ClientMetrics, type ProducerGlobalConfig } from 'node-rdkafka'
import { v4 as uuid } from 'uuid'
// use azure sdk

async function publishClick (brokerList: ProducerGlobalConfig['metadata.broker.list']): Promise<void> {
  const topic = 'click'
  const producer = new Kafka.Producer({
    debug: 'all',
    'client.id': 'spike',
    'metadata.broker.list': brokerList
  })
  console.log('🚀 ~ file: click.spec.ts:15 ~ publishClick ~ trying to connect producer:', brokerList, producer.isConnected())

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
  console.log('🚀 ~ file: click.spec.ts:67 ~ publishClick ~ data:', { data, err })
  console.log('disconnected')
}

describe('send event', () => {
  let kafkaContainer: StartedKafkaContainer | undefined
  const kafkaPort = 9093
  beforeAll(async () => {
    kafkaContainer = await new KafkaContainer()
      .withExposedPorts(kafkaPort)
      .withStartupTimeout(100000)
      .start()

    console.log(
      '🚀 ~ file: click.spec.ts:50 ~ it ~ started kafkaContainer:',
      kafkaContainer.getId()
    )
  })

  it('should send click', async () => {
    if (kafkaContainer === undefined) {
      fail('undefined kafkaContainer')
    }
    const port = kafkaContainer.getMappedPort(kafkaPort)
    const host = kafkaContainer.getHost()
    // const port = kafkaPort
    // const host = 'localhost'
    const broker = `${host}:${port}`
    console.log(`🚀 ~ file: click.spec.ts:66 ~ it ~ host: ${broker}`)

    await publishClick(broker)
  })

  afterAll(async () => {
    if (kafkaContainer === undefined) {
      return
    }
    try {
      const stoppedContainer: StoppedTestContainer =
                await kafkaContainer.stop()
      console.log(
        '🚀 ~ file: click.spec.ts:14 ~ it ~ stoppedContainer:',
        stoppedContainer.getId()
      )
    } catch (e) {
      console.error(e)
    }
  })
})
