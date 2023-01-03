import { ChatGPTAPIBrowser } from 'chatgpt'
import * as dotenv from 'dotenv'
import { Queue, TextResolver } from './utils/index.js';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters'
import { ActionsController } from './actions/index.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const chatGPT = new ChatGPTAPIBrowser({
  email: process.env.OPENAI_EMAIL,
  password: process.env.OPENAI_PASSWORD,
})

const { onResetThread, onQuery } = new ActionsController(chatGPT)

const queue = new Queue()

const init = async () => {
  try {
    await chatGPT.initSession()

    bot.command('start', ctx => ctx.reply(TextResolver.welcome));

    bot.command('new', ctx => {
      queue.add(() => onResetThread(ctx))
    });

    bot.on(message('text'), async ctx => {
      const question = ctx?.update.message?.text

      if(question) {
        const currentQuery = queue.count
        
        const { message_id } = await ctx.reply(TextResolver.query(currentQuery), {
          reply_to_message_id: ctx.message?.message_id,
        })

        if(currentQuery) {

          let msgPos = currentQuery
          
          const onDecrement = async () => {

            await ctx.telegram.editMessageText(ctx.chat.id, message_id, undefined, TextResolver.query(--msgPos))

            if (!msgPos) {
              queue.removeListener(queue.events.decrement, onDecrement)
            }
          }

          queue.on(queue.events.decrement, onDecrement)

        }

        queue.add(() => onQuery(question, ctx, message_id))
      }
    });

    bot.launch()

  } catch (e) {
    console.log(e)
  }
}

init()
