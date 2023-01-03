declare namespace NodeJS {
  interface ProcessEnv {
    readonly OPENAI_EMAIL: string
    readonly BOT_TOKEN: string
    readonly OPENAI_PASSWORD: string
  }
}
