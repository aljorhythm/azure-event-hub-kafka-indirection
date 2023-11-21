import {
  type TestContainer,
  type StartedTestContainer,
  type StoppedTestContainer,
  GenericContainer
} from 'testcontainers'

const container: TestContainer = new GenericContainer('alpine')

describe('send event', () => {
  it('should send click', async () => {
    const startedContainer: StartedTestContainer = await container.start()

    const stoppedContainer: StoppedTestContainer = await startedContainer.stop()
    console.log('🚀 ~ file: click.spec.ts:14 ~ it ~ stoppedContainer:', stoppedContainer)
  })
})
