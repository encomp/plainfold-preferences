declare module '@plainfold/design-tokens' {
  export interface PfTheme {
    id: string
    name: string
    description: string
    version: string
    tokens: Record<string, string>
    icons?: Record<string, string>
  }
  export function applyTheme(theme: PfTheme): void
  export function resetTheme(theme: PfTheme): void
  export function validateThemeFull(theme: unknown): { success: boolean; error?: { issues: Array<{ message: string }> } }
  export function sanitizeSvgIcon(raw: string): string
  export const BUNDLED_THEMES: PfTheme[]
  export const BUNDLED_THEME_IDS: Set<string>
  export class ThemeLibrary {
    static getAll(): Promise<PfTheme[]>
    static add(theme: PfTheme): Promise<void>
    static remove(id: string): Promise<void>
  }
}
