// https://github.com/antfu/eslint-plugin-command/blob/main/src/commands/_test-utils.ts

import type { Command } from 'eslint-plugin-command/commands'
import type { TestCase } from 'eslint-vitest-rule-tester'
import * as tsParser from '@typescript-eslint/parser'

import config from 'eslint-plugin-command/config'
import { run as _run } from 'eslint-vitest-rule-tester'

export { unindent as $ } from 'eslint-vitest-rule-tester'

export function run(command: Command | Command[], ...cases: (TestCase | string)[]) {
  const commands = Array.isArray(command) ? command : [command]

  const validCases: (TestCase | string)[] = []
  const invalidCases: TestCase[] = []

  for (const c of cases) {
    if (typeof c === 'string')
      validCases.push(c)
    else
      invalidCases.push(c)
  }

  const rule = config({ commands }).plugins!.command.rules!.command
  _run({
    name: commands[0].name,
    rule,
    languageOptions: {
      parser: tsParser,
    },
    valid: validCases,
    invalid: invalidCases,
  })
}
