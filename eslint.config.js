import antfu from '@antfu/eslint-config'

export default antfu({ react: true, css: true, html: true, markdown: true, ignores: ['docs/**'] }, {
  rules: {
    'unicorn/filename-case': ['error', {
      cases: { pascalCase: true, camelCase: true },
      ignore: [/^README/],
    }],
  },
}, {
  files: ['src/assets/**'],
  rules: {
    'unicorn/filename-case': ['error', { cases: { kebabCase: true } }],
  },
}, {
  files: ['e2e/**'],
  rules: {
    'unicorn/filename-case': ['error', { cases: { kebabCase: true } }],
  },
})
