import { builtinCommands as commands } from 'eslint-plugin-command/commands'
// import { codegen } from './codegen'
import { keepDto } from './keep-dto'

// @keep-sorted
export {
  // codegen,
  keepDto,
}

// @keep-sorted
export const builtinCommands = [
  ...commands,
  // codegen,
  keepDto,
]
