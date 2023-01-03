import { EventEmitter } from 'events'

export type Task = () => Promise<any>

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

  constructor() {
    super()
    this.arr = []
    this.inProgress = false
    this.events = QueueEvents
  }

  get count () {
    return this.arr.length + (this.inProgress ? 1 : 0)
  }

  add = (task: Task) => {
    this.arr.push(task)

    super.emit(this.events.increment, this.count)

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
        super.emit(this.events.start)
        this.inProgress = true
        await task()
        super.emit(this.events.finish)
      } else {
        super.emit(this.events.empty)
      }
    } catch(e) {
      console.log(e)
    } finally {
      this.inProgress = false

      if(this.arr.length) {
        super.emit(this.events.decrement, this.count)
        this.execute()
      }
    }
  }
}
