// standalone consumer

import { KafkaConsumer } from 'node-rdkafka'

const topic = 'click'
const clientId = 'spike'
const brokerList = '192.168.106.2:' + '49402'
console.log('🚀 ~ file: index.ts:6 ~ brokerList:', brokerList)

const main = async function (): Promise<void> {
  const consumer = new KafkaConsumer({
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
    })
    .on('event.log', (err) => {
      console.log('error', err)
    })
    .on('disconnected', () => {
      console.log('disconnected')
    })
}

main().catch(console.error)
