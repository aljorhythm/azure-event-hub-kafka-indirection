export interface EventsAdaptor {
  publish: (msg: string) => Promise<void>
}

export class Clicks {
  eventsAdaptor: EventsAdaptor

  constructor (eventsAdaptor: EventsAdaptor) {
    this.eventsAdaptor = eventsAdaptor
  }

  async publishClick (msg: string): Promise<void> {
    await this.eventsAdaptor.publish(msg)
  }
}
