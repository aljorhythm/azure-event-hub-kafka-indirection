import Kafka, { type ClientMetrics } from 'node-rdkafka'
import { v4 as uuid } from 'uuid'

interface Args {
  brokerList: string
  clientId: string
  topic: string
}

export interface NodeRdkafkaAdaptor {
  producer: Kafka.Producer
  publish: (msg: string) => Promise<void>
  disconnect: () => Promise<{ error: Error, data: ClientMetrics }>
}

export async function newNodeRdkafkaAdaptor ({ brokerList, clientId, topic }: Args): Promise<NodeRdkafkaAdaptor> {
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

  producer.on('event.log', console.log)

  producer.connect()

  await readyProducer

  return {
    producer,
    async publish (msg: string) {
      const messageKey = uuid()
      producer.produce(
        topic,
        null,
        Buffer.from(msg),
        messageKey,
        Date.now()
      )
    },
    async disconnect () {
      return await new Promise<{ error: Error, data: ClientMetrics }>((resolve) => {
        producer.disconnect((error, data) => {
          resolve({ error, data })
        })
      })
    }
  }
}
