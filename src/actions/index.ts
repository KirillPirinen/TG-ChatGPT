import { ChatGPTAPIBrowser } from "chatgpt";
import { Context } from 'telegraf'

export class ActionsController {
  public chatApi: ChatGPTAPIBrowser
  public conversations: Map<number, { conversationId: string, parentMessageId: string, response: string }>

  constructor(chatApi: ChatGPTAPIBrowser) {
    this.chatApi = chatApi
    this.conversations = new Map()
  }

   onQuery = async (
    question: string, 
    ctx: Context, 
    message_id: number
  ) => {
    const chatId = ctx.message?.chat.id
    const prev = chatId ? this.conversations.get(chatId) : undefined

    try {
      const { 
        response, 
        messageId: parentMessageId, 
        conversationId 
      } = await this.chatApi.sendMessage(question, prev)

      chatId && this.conversations.set(chatId, { parentMessageId, conversationId, response })

      response && ctx.chat && ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, response)

    } catch (e) {
      ctx.chat && ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, 'Извините. Что-то пошло не так.')
    }
  }

  onResetThread = async (ctx: Context) => {
    await this.chatApi.resetThread()
    ctx.message?.chat.id && this.conversations.delete(ctx.message.chat.id)
    ctx.replyWithMarkdownV2("*new Conversation Started*");
  }

}

