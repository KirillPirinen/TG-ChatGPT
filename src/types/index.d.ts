declare namespace NodeJS {
  interface ProcessEnv {
    readonly OPENAI_TOKEN: string
    readonly BOT_TOKEN: string
  }
}
