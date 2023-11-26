import { EventHubProducerClient } from '@azure/event-hubs'

export interface AzureSdkAdaptor {
  producer: EventHubProducerClient
  publish: (msg: string) => Promise<void>
  disconnect: () => Promise<void>
}

export async function newAzureSDKAdaptor (connectionString: string, eventHubName: string): Promise<AzureSdkAdaptor> {
  const producer = new EventHubProducerClient(connectionString, eventHubName)

  return {
    producer,
    async disconnect () {
      await producer.close()
    },
    async publish (msg: string) {
      const batchOptions = {
      }

      const batch = await producer.createBatch(batchOptions)

      const isAdded: boolean = batch.tryAdd({ body: msg })

      if (!isAdded) {
        throw new Error(`msg batch add failed ${msg}`)
      }

      if (batch.count === 0) {
        throw new Error(`Message was too large and can't be sent until it's made smaller. Skipping... ${msg}`)
      }

      console.log(`Batch is full - sending ${batch.count} messages as a single batch.`)
      await producer.sendBatch(batch)
    }
  }
}
