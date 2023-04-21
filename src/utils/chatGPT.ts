import { ChatGPTUnofficialProxyAPI, SendMessageBrowserOptions } from 'chatgpt'
import { getAuthToken } from './auth.js'
import { logger } from './logger.js'

class ChatGPT {
  readonly proxies: Array<string>
  private clients: Array<ChatGPTUnofficialProxyAPI>
  private priorClient: ChatGPTUnofficialProxyAPI | undefined

  constructor(proxies: Array<string>) {
    this.proxies = proxies
    this.clients = []
    this.priorClient
  }

  init = async () => {

      const accessToken = await getAuthToken()

      this.clients = this.proxies.map(apiReverseProxyUrl => new ChatGPTUnofficialProxyAPI({ 
        accessToken,
        apiReverseProxyUrl
      }))

      this.priorClient = this.clients[0]
  }

  updateToken = async () => {
    const accessToken = await getAuthToken()
    this.clients.forEach(client => {
      client.accessToken = accessToken
    })
  }

  sendMessage = async (question: string, params: SendMessageBrowserOptions) => {
      try {
        return await this.priorClient!.sendMessage(question, params)
      } catch(e) {
        logger.error('sendMessage error', e)
        await this.updateToken()

        for(let i = 0; i < this.clients.length; i++) {
          const client = this.clients[i]
          try {
            const res = await client.sendMessage(question, params)
            this.priorClient = client
            return res
          } catch {
            continue
          }
        }

        throw new Error('All apiReverseProxyUrl unavaliable')
      }
  } 
}

export default ChatGPT
