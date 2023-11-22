import { type StoppedTestContainer } from 'testcontainers'

import { KafkaContainer, type StartedKafkaContainer } from '@testcontainers/kafka'
import Kafka, { type ClientMetrics, type ProducerGlobalConfig } from 'node-rdkafka'

// use azure sdk

async function publishClick (brokerList: ProducerGlobalConfig['metadata.broker.list']): Promise<void> {
  const producer = new Kafka.Producer({
    debug: 'all',
    'client.id': 'spike',
    'metadata.broker.list': brokerList
  })
  console.log('🚀 ~ file: click.spec.ts:15 ~ publishClick ~ trying to connect producer:', brokerList, producer.isConnected())

  // Wait for the ready event before proceeding
  // const onReady = new Promise<void>((resolve) => {
  //   producer.on('ready', () => {
  //     resolve()
  // try {
  //   producer.produce(
  //   // Topic to send the message to
  //     'topic',
  //     // optionally we can manually specify a partition for the message
  //     // this defaults to -1 - which will use librdkafka's default partitioner (consistent random for keyed messages, random for unkeyed messages)
  //     null,
  //     // Message to send. Must be a buffer
  //     Buffer.from('Awesome message'),
  //     // for keyed messages, we also specify the key - note that this field is optional
  //     'Stormwind',
  //     // you can send a timestamp here. If your broker version supports it,
  //     // it will get added. Otherwise, we default to 0
  //     Date.now()
  //   // you can send an opaque token here, which gets passed along
  //   // to your delivery reports
  //   )
  // } catch (err) {
  //   console.error('A problem occurred when sending our message')
  //   console.error(err)
  // }
  //   })
  // })

  const readyProducer = new Promise<void>((resolve) => {
    producer.on('ready', () => {
      resolve()
    })
  })

  producer.connect()

  await readyProducer

  console.log('🚀 ~ file: click.spec.ts:48 ~ producer.on ~ producer isConnected()', producer.isConnected())

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
