import * as dotenv from 'dotenv'
import { Queue, TextResolver, logger, getRandom } from './utils/index.js';
import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters'
import { ActionsController } from './actions/index.js';
import { exec } from 'child_process';
import { createClient } from 'redis';
import { RedisAdapter } from './utils/persistance.js';
import { IPrevMessage } from './types/types'
import ChatGPT from './utils/chatGPT.js'

dotenv.config();

const chatGPT = new ChatGPT([
  'https://bypass.duti.tech/api/conversation',
  'https://gpt.pawan.krd/backend-api/conversation',
])

const redis = createClient();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.catch((err) => logger.error('error :', err))

const queue = new Queue(40)

let attempts = 0

const init = async () => {
  logger.log('init')
  try {

    await chatGPT.init()

    await redis.connect()

    //@ts-ignore
    const { onResetThread, onQuery } = new ActionsController(chatGPT, new RedisAdapter<IPrevMessage>(redis))

    bot.command('start', ctx => ctx.reply(TextResolver.welcome));

    bot.command('restart', async (ctx, next) => {
      if(process.env.ADMIN_ID === String(ctx.from.id)) {
        return exec('pm2 restart index')
      }
      return await next()
    });

    bot.use(async (ctx, next) => {
      //@ts-ignore
      const chatId = ctx.update.message?.chat.id

      if(queue.getCountByInitiator(chatId) > 3) {
        return await ctx.reply(TextResolver.maxQuery, {
          reply_to_message_id: ctx.message?.message_id,
        })
      }
      
      return await next()
    })

    bot.command('new', ctx => {
      queue.add({ cb: () => onResetThread(ctx) })
    });

    bot.on(message('text'), async ctx => {
      const question = ctx?.update.message?.text
      const chatId = ctx.chat.id

      logger.log('message', chatId)

      if(question) {
        try {
        const currentQuery = queue.count

        const { message_id } = await ctx.reply(TextResolver.query(currentQuery), {
          reply_to_message_id: ctx.message?.message_id,
        })

        if(currentQuery) {

          let msgPos = currentQuery
          
          const onDecrement = async () => {
            try {
              await ctx.telegram.editMessageText(chatId, message_id, undefined, TextResolver.query(--msgPos))
            } finally {
              if (!msgPos) {
                queue.removeListener(queue.events.decrement, onDecrement)
              }
            }
          }

          queue.on(queue.events.decrement, onDecrement)

        }

        queue.add({ initiator: chatId, cb: () => onQuery(question, ctx, message_id) })

        } catch (e) {
          logger.error(e)
        }
      } 
    });

    bot.launch()

  } catch (e) {
    logger.error(e)
    redis.disconnect()
    if(attempts < 10) {
      attempts++
      setTimeout(init, getRandom(5e3, 10e3))
    }
  }
}

process.once('SIGINT', () => {
  bot.stop('SIGINT')
  redis.disconnect()
});

process.once('SIGTERM', () => {
  bot.stop('SIGTERM')
  redis.disconnect()
});

init()
