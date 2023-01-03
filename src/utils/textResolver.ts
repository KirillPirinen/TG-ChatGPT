import plural from 'plural-ru'

export const TextResolver = {
  welcome: 'Привет! Это Proxy-bot нейросети ChatGPT.\nНейросеть работает как чат и может выдавать ответ на основании предыдущих вопросов, по-этому для того чтобы очистить предыдущее состояние и начать новый диалог отправь команду:\n/new',
  query: (currentQuery: number) => currentQuery ? `В очереди ${currentQuery} ${plural(1, 'запрос', 'запроса', 'запросов')}. Ожидайте.` : `🤔`,
}
