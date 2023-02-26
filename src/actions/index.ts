import { ChatGPTAPI } from 'chatgpt';
import { Context, TelegramError } from 'telegraf'
import { ErrorResolver, logger } from '../utils/index.js';
import { IPrevMessage } from '../types/types'

interface IPersistApi {
  set: (string: string, object: IPrevMessage) => Promise<any>
  get: (string: string) => Promise<IPrevMessage>
  delete: (string: string) => Promise<any>
}

export class ActionsController {
  public chatApi: ChatGPTAPI
  public persistApi: IPersistApi

  constructor(chatApi: ChatGPTAPI, persistApi: IPersistApi) {
    this.chatApi = chatApi
    this.persistApi = persistApi
  }
   
   onQuery = async (
    question: string, 
    ctx: Context, 
    message_id: number
  ) => {
    const chatId = ctx.message?.chat.id
    const prev = chatId ? await this.persistApi.get(String(chatId)) : undefined

    let intId: NodeJS.Timer | undefined;

    try {

      if(chatId) {
        intId = setInterval(async () => {
          await ctx.telegram.sendChatAction(chatId, 'typing').catch(() => clearInterval(intId))
        }, 3000)

        const { 
          text, 
          id: parentMessageId, 
          conversationId 
        } = await this.chatApi.sendMessage(question.trim(), {...prev, timeoutMs: 1e3 * 60 * 2 })
       
        clearInterval(intId)
        
        if(text) {
          conversationId && await this.persistApi.set(String(chatId), { parentMessageId, conversationId })
          try {
            await ctx.telegram.editMessageText(chatId, message_id, undefined, text, {
              parse_mode: "Markdown",
            })
          } catch (e) {
            if(e instanceof TelegramError && e.message.includes('parse')) {
              try {
                await ctx.telegram.editMessageText(chatId, message_id, undefined, text)
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
      ctx.message?.chat.id && await this.persistApi.delete(String(ctx.message.chat.id))
      await ctx.replyWithMarkdownV2("*new Conversation Started*")
    } catch (e) {
      logger.error(e, 'resetThread error')
    }
  }

}

