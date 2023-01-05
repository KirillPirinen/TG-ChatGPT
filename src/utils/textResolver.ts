import plural from 'plural-ru'

export const TextResolver = {
  welcome: 'Привет! Это Proxy-bot нейросети ChatGPT.\nНейросеть работает как чат и может выдавать ответ на основании предыдущих вопросов, по-этому для того чтобы очистить предыдущее состояние и начать новый диалог отправь команду:\n/new',
  query: (currentQuery: number) => currentQuery ? `В очереди ${currentQuery} ${plural(currentQuery, 'запрос', 'запроса', 'запросов')}. Ожидайте.` : `🤔`,
  maxQuery: `Максимальное количество одновременных запросов: 3. Подождите завершения`,
}

export const Errors: Record<string | number, string> = {
  429: 'Превышен общий лимит сообщений в час, блок со стороны Chat-GPT. Попробуйте позже',
  default: 'Извините. Что-то пошло не так.'
}

export const ErrorResolver = (code: string | number) => Errors[code] || Errors.default
