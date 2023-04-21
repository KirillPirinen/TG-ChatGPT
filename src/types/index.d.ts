declare namespace NodeJS {
  interface ProcessEnv {
    readonly OPENAI_TOKEN: string
    readonly BOT_TOKEN: string
    readonly OPENAI_ACCESS_TOKEN: string
    readonly OPENAI_EMAIL: string
    readonly OPENAI_PASSWORD: string
    readonly PWD: string
  }
}
