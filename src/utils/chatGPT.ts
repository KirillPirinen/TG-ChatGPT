import { ChatGPTUnofficialProxyAPI, SendMessageBrowserOptions } from 'chatgpt'
import Authenticator from 'openai-token'

class ChatGPT {
  readonly proxies: Array<string>
  private clients: Array<ChatGPTUnofficialProxyAPI>
  private priorClient: ChatGPTUnofficialProxyAPI | undefined
  private auth: Authenticator | undefined

  constructor(proxies: Array<string>) {
    this.proxies = proxies
    this.clients = []
    this.priorClient
  }

  init = async () => {
      this.auth = new Authenticator(process.env.OPENAI_EMAIL, process.env.OPENAI_PASSWORD);

      await this.auth.begin()
      const accessToken = await this.auth.getAccessToken()

      this.clients = this.proxies.map(apiReverseProxyUrl => new ChatGPTUnofficialProxyAPI({ 
        accessToken,
        apiReverseProxyUrl
      }))

      this.priorClient = this.clients[0]
  }

  updateToken = async () => {
    const accessToken = await this.auth!.getAccessToken()
    this.clients.forEach(client => {
      client.accessToken = accessToken
    })
  }

  sendMessage = async (question: string, params: SendMessageBrowserOptions) => {
      try {
        return await this.priorClient!.sendMessage(question, params)
      } catch {
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
