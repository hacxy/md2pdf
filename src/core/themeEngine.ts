export interface ThemeConfig {
  id: string
  name: string
  description: string
}

export const themes: ThemeConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'GitHub 风格，清晰简洁',
  },
  {
    id: 'newsprint',
    name: 'Newsprint',
    description: '报纸风格，衬线字体，温暖质感',
  },
  {
    id: 'night',
    name: 'Night',
    description: '深色主题，适合夜间使用',
  },
  {
    id: 'pixyll',
    name: 'Pixyll',
    description: '极简设计，衬线正文 + 无衬线标题',
  },
  {
    id: 'whitey',
    name: 'Whitey',
    description: '优雅白色，居中标题，经典排版',
  },
]

export function getThemeById(id: string): ThemeConfig | undefined {
  return themes.find(t => t.id === id)
}
