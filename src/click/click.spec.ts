import {
  type StoppedTestContainer
} from 'testcontainers'

import { KafkaContainer } from '@testcontainers/kafka'

describe('send event', () => {
  it('should send click', async () => {
    const kafkaContainer = await new KafkaContainer().withExposedPorts(9093)
      .withStartupTimeout(100000)
      .start()

    const stoppedContainer: StoppedTestContainer = await kafkaContainer.stop()
    console.log('🚀 ~ file: click.spec.ts:14 ~ it ~ stoppedContainer:', stoppedContainer)
  })
})
