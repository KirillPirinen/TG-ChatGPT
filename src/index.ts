import { ChatGPTAPIBrowser } from 'chatgpt'
import * as dotenv from 'dotenv'
import { Queue, TextResolver } from './utils/index.js';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters'
import { ActionsController } from './actions/index.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.catch((err) => console.log('Error: ', err))

const chatGPT = new ChatGPTAPIBrowser({
  email: process.env.OPENAI_EMAIL,
  password: process.env.OPENAI_PASSWORD,
  minimize: true
})

const { onResetThread, onQuery } = new ActionsController(chatGPT)

const queue = new Queue(20)

const init = async () => {
  try {
    await chatGPT.initSession()

    bot.command('start', ctx => ctx.reply(TextResolver.welcome));

    bot.use(async (ctx, next) => {
      //@ts-ignore
      const chatId = ctx.update.message?.chat.id
      const currentUserQueryCount = queue.getCountByInitiator(chatId)

      if(currentUserQueryCount > 3) {
        return ctx.reply(TextResolver.maxQuery, {
          reply_to_message_id: ctx.message?.message_id,
        })
      }
      
      next()
    })

    bot.command('new', ctx => {
      queue.add({ cb: () => onResetThread(ctx) })
    });

    bot.on(message('text'), async ctx => {
      const question = ctx?.update.message?.text
      const chatId = ctx.chat.id

      if(question) {
        const currentQuery = queue.count
        
        const { message_id } = await ctx.reply(TextResolver.query(currentQuery), {
          reply_to_message_id: ctx.message?.message_id,
        })

        if(currentQuery) {

          let msgPos = currentQuery
          
          const onDecrement = async () => {

            await ctx.telegram.editMessageText(chatId, message_id, undefined, TextResolver.query(--msgPos))

            if (!msgPos) {
              queue.removeListener(queue.events.decrement, onDecrement)
            }
          }

          queue.on(queue.events.decrement, onDecrement)

        }

        queue.add({ initiator: chatId, cb: () => onQuery(question, ctx, message_id) })
      }
    });

    bot.launch()

  } catch (e) {
    console.log(e)
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

init()
