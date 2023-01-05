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
    let intId: NodeJS.Timer | undefined;

    try {

      if(chatId) {
        intId = setInterval(() => {
          ctx.telegram.sendChatAction(chatId, 'typing').catch(() => clearInterval(intId))
        }, 3000)
      }
      
      const { 
        response, 
        messageId: parentMessageId, 
        conversationId 
      } = await this.chatApi.sendMessage(question, prev)

      clearInterval(intId)

      chatId && this.conversations.set(chatId, { parentMessageId, conversationId, response })

      response && ctx.chat && ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, response, {
        parse_mode: "Markdown",
      })

    } catch (e) {
      if(ctx.chat) {
        try {
          ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, 'Извините. Что-то пошло не так.')
        } catch (e) {
          ctx.reply('Извините. Что-то пошло не так.')
        }
      }
    } finally {
      clearInterval(intId)
    }
  }

  onResetThread = async (ctx: Context) => {
    await this.chatApi.resetThread()
    ctx.message?.chat.id && this.conversations.delete(ctx.message.chat.id)
    ctx.replyWithMarkdownV2("*new Conversation Started*");
  }

}

