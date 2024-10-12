import { builtinCommands as commands } from 'eslint-plugin-command/commands'
import { keepDto } from './keep-dto'

// @keep-sorted
export {
  keepDto,
}

// @keep-sorted
export const builtinCommands = [
  ...commands,
  keepDto,
]
