declare module '@plainfold/store' {
  export const Settings: {
    get: <T>(key: string) => Promise<T | undefined>
    set: (key: string, value: unknown) => Promise<string>
    remove: (key: string) => Promise<void>
  }
  export function clearAll(): Promise<void>
}
