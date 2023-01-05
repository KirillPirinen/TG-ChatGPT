import { EventEmitter } from 'events'
import { logger } from './logger.js'

export type Task = {
  initiator?: number | string
  cb: () => Promise<any>
}

export const QueueEvents = {
  increment: 'increment',
  decrement: 'decrement',
  start: 'start',
  finish: 'finish',
  empty: 'empty'
}

export class Queue extends EventEmitter {
  private arr: Array<Task>
  private inProgress: boolean
  readonly events: typeof QueueEvents
  readonly initiators: Record<string | number, number>

  constructor(listenersCount: number) {
    super()
    this.arr = []
    this.initiators = {}
    this.inProgress = false
    this.events = QueueEvents
    super.setMaxListeners(listenersCount)
  }

  get count () {
    return this.arr.length + (this.inProgress ? 1 : 0)
  }

  getCountByInitiator = (initiator: string | number) => this.initiators[initiator] || 0

  add = (task: Task) => {
    this.arr.push(task)

    const initiator = task.initiator || 'unknown'
    this.initiators[initiator] = (this.initiators[initiator] || 0) + 1

    this.emit(this.events.increment, this.count)

    this.execute()
    return this.arr.length
  }

  execute = async () => {
    if(this.inProgress) {
      return;
    }

    const task = this.arr.shift()
    try {
      if(task) {
        this.emit(this.events.start)
        this.inProgress = true
        await task.cb()
        this.emit(this.events.finish)
      } else {
        this.emit(this.events.empty)
      }
    } catch(e) {
      logger.error(e, 'queue catch')
    } finally {
      this.inProgress = false
      
      if(task) {
        this.emit(this.events.decrement, this.count)
        this.initiators[task.initiator || 'unknown']--
      }

      if(this.arr.length) {
        this.execute()
      }
    }
  }
}
