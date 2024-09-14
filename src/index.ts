import type { TypedFlatConfigItem } from '@antfu/eslint-config'
import type { Command } from 'eslint-plugin-command/commands'
import { antfu } from '@antfu/eslint-config'
import command from 'eslint-plugin-command/config'
import { builtinCommands } from './commands'

type AntFuParameters = Parameters<typeof antfu>
type Options = AntFuParameters[0]
export type UserConfig = AntFuParameters[1]

type AntFuReturnType = ReturnType<typeof antfu>

export type { TypedFlatConfigItem }

export { builtinCommands }

export interface SakuraOptions extends NonNullable<Options> {
  /** custom eslint-plugin-command/commands */
  commands: Command[]
}

const stylisticRules: UserConfig = {
  name: 'sakura/stylistic/rules',
  // @keep-sorted
  rules: {
    'antfu/if-newline': 'off',
    'style/max-len': [
      'error',
      // @keep-sorted
      {
        code: 120,
        comments: 80,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreUrls: true,
        tabWidth: 2,
      },
    ],
  },
}

/**
 * Construct an array of ESLint flat config items.
 *
 * @link https://github.com/antfu/eslint-config
 * @param {SakuraOptions} options
 *  The options for generating the ESLint configurations.
 * @param {Awaitable<TypedFlatConfigItem | TypedFlatConfigItem[]>[]} userConfigs
 *  The user configurations to be merged with the generated configurations.
 * @returns {Promise<TypedFlatConfigItem[]>}
 *  The merged ESLint configurations.
 */
// eslint-disable-next-line ts/promise-function-async
export function sakura(
  { commands: userCommands, ...options }: Partial<SakuraOptions> = {},
  ...userConfigs: UserConfig[]
): AntFuReturnType {
  // const isInEditor = options.isInEditor ?? isInEditorEnv()
  let composer = antfu(
    options,
    stylisticRules,
    ...userConfigs,
  )

  // console.warn('isInEditor', isInEditor)
  composer = composer.replace(
    'antfu/command/rules',
    {
      ...command({
        commands: userCommands || builtinCommands,
      }),
      name: 'sakura/command/rules',
    },
  )

  return composer
}

export default sakura
