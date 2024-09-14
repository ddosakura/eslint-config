import { defineCommand } from 'eslint-plugin-command/commands'

export const codegen = defineCommand({
  name: 'codegen',
  match: /^\s*[/:@]\s*codegen$/,
  action(ctx) {
    ctx.reportError('Report error')
  },
})
