import { ChatGPTAPIBrowser } from "chatgpt";
import { Context, TelegramError } from 'telegraf'
import { ErrorResolver, logger } from "../utils/index.js";

export class ActionsController {
  public chatApi: ChatGPTAPIBrowser
  public conversations: Map<number, { conversationId: string, parentMessageId: string }>

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
        intId = setInterval(async () => {
          await ctx.telegram.sendChatAction(chatId, 'typing').catch(() => clearInterval(intId))
        }, 3000)

        const { 
          response, 
          messageId: parentMessageId, 
          conversationId 
        } = await this.chatApi.sendMessage(question.trim(), {...prev, timeoutMs: 1e3 * 60 * 3 })
  
        clearInterval(intId)
        
        if(response) {
          this.conversations.set(chatId, { parentMessageId, conversationId })
          try {
            await ctx.telegram.editMessageText(chatId, message_id, undefined, response, {
              parse_mode: "Markdown",
            })
          } catch (e) {
            if(e instanceof TelegramError && e.message.includes('parse')) {
              try {
                await ctx.telegram.editMessageText(chatId, message_id, undefined, response)
              } catch (innerError) {
                throw innerError
              }
            } else {
              throw e
            }
          }
        }

      }

    } catch (e: any) {
      logger.error(e, 'Task inner error')
      const errorText = ErrorResolver(e.statusCode)
      if(chatId) {
        try {
          await ctx.telegram.editMessageText(chatId, message_id, undefined, errorText)
        } catch (_) {
          await ctx.reply(errorText)
        }
      }
    } finally {
      clearInterval(intId)
    }
  }

  onResetThread = async (ctx: Context) => {
    try {
      await Promise.all([
        this.chatApi.resetThread(),
        ctx.replyWithMarkdownV2("*new Conversation Started*")
      ])
    } catch (e) {
      logger.error(e, 'resetThread error')
    } finally {
      ctx.message?.chat.id && this.conversations.delete(ctx.message.chat.id)
    }
  }

}

