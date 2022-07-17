import { computed, nextTick, onUnmounted, ref } from 'vue'
import { useThrottleFn } from '@vueuse/shared'

export type State = 'initial' | 'result'
export type FrameworkType =
    | 'vitepress'
    | 'iles'
    | 'astro'
    | 'vue'
    | 'react'
    | 'preact'
    | 'solid'
    | 'svelte'
    | 'svelteKit'
    | 'javascript'
    | 'typescript'
    | undefined
export type StrategyType = 'generateSW' | 'injectManifest' | undefined
export type BehaviorType = 'prompt' | 'autoUpdate' | undefined
export type InjectRegisterType = 'inline' | 'script' | undefined
export type YesNoType = 'true' | 'false' | undefined

export interface BuilderError {
  key: string
  text: string
  focus: () => void
}

export interface RadioData<T> {
  value: T
  text: string
  disabled?: boolean
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

export interface BuilderElement {
  key: string
  focus: () => void
  validate: () => Promise<BuilderError[]>
  isValid: () => boolean
  withState: (withError: boolean, focusInput: boolean) => void
}

export const focusInput = (element?: HTMLElement, to: ScrollLogicalPosition = 'nearest') => {
  setTimeout(() => element?.focus(), 0)
  setTimeout(() => element?.scrollIntoView({
    block: to,
    behavior: 'smooth',
  }), 0)
}

export const inputs = ref<BuilderElement[]>([])
export const errors = ref<BuilderError[]>([])

export function usePWABuilder() {
  const state = ref<State>('initial')
  const title = ref<string | undefined>()
  const description = ref<string | undefined>()
  const shortName = ref<string | undefined>()
  const themeColor = ref<string | undefined>('#ffffff')
  const strategy = ref<StrategyType | undefined>('generateSW')
  const behavior = ref<BehaviorType | undefined>('prompt')
  const warnUser = ref<YesNoType | undefined>('false')
  const injectRegister = ref<InjectRegisterType | undefined>(undefined)
  const framework = ref<FrameworkType | undefined>(undefined)
  const ts = ref<YesNoType | undefined>(undefined)

  const generating = ref(false)

  const strategies = createStrategies()
  const behaviors = createBehaviors()
  const warns = createWarnReady()
  const injectRegisters = createInjectRegisters()
  const frameworks = createFrameworks()
  const tss = createTS()

  const showFrameworks = computed(() => {
    return behavior.value === 'prompt' || warnUser.value === 'true'
  })

  const showInjectRegister = computed(() => {
    return behavior.value === 'autoUpdate' && warnUser.value === 'false'
  })

  const showTS = computed(() => {
    return showFrameworks.value && !(framework.value === 'javascript' || framework.value === 'typescript')
  })

  const generateTypeScript = computed(() => {
    return showTS.value || framework.value === 'typescript'
  })

  const reset = async () => {
    title.value = undefined
    description.value = undefined
    shortName.value = undefined
    themeColor.value = '#FFFFFF'
    strategy.value = 'generateSW'
    behavior.value = 'prompt'
    warnUser.value = 'false'
    injectRegister.value = undefined
    framework.value = undefined
    ts.value = undefined
    await nextTick()
    errors.value.splice(0)
    await nextTick()
    inputs.value.forEach((i) => {
      i.withState(false, i.key === 'title')
    })
  }

  const generate = useThrottleFn(async () => {
    if (generating.value)
      return

    generating.value = true
    await nextTick()
    errors.value.splice(0)
    await nextTick()
    try {
      const result = await Promise.all(inputs.value.filter((i) => {
        switch (i.key) {
          case 'title':
          case 'shortName':
          case 'description':
          case 'themeColor':
          case 'strategy':
          case 'behavior':
          case 'warn':
            return true
        }

        return false
      }).map((i) => {
        return i.validate()
      }))
      const validationResult = result.filter(r => r.length > 0).map(r => r[0])
      let customErrors: BuilderError[] | undefined
      if (showInjectRegister.value) {
        customErrors = await inputs.value.find(i => i.key === 'injectRegister')?.validate()
        if (customErrors)
          validationResult.push(customErrors[0])
      }

      if (showFrameworks.value) {
        customErrors = await inputs.value.find(i => i.key === 'frameworks')?.validate()
        if (customErrors)
          validationResult.push(customErrors[0])
      }

      if (showTS.value) {
        customErrors = await inputs.value.find(i => i.key === 'typescript')?.validate()
        if (customErrors)
          validationResult.push(customErrors[0])
      }

      if (validationResult) {
        errors.value.splice(0, errors.value.length, ...validationResult)
        await nextTick()
        validationResult[0].focus()
        return
      }
      // state.value = 'result'
      // await new Promise(resolve => setTimeout(resolve, 2000))
    }
    finally {
      generating.value = false
    }
  }, 256, false, true)

  onUnmounted(() => {
    inputs.value.splice(0)
  })

  return {
    state,
    title,
    description,
    shortName,
    themeColor,
    strategy,
    behavior,
    warnUser,
    injectRegister,
    framework,
    ts,
    showInjectRegister,
    showFrameworks,
    showTS,
    strategies,
    behaviors,
    warns,
    injectRegisters,
    frameworks,
    tss,
    generate,
    reset,
    generating,
  }
}

function createFrameworks() {
  return <RadioData<FrameworkType>[]>[{
    value: 'javascript',
    text: 'Vanilla JS',
  }, {
    value: 'typescript',
    text: 'TypeScript',
  }, {
    value: 'vue',
    text: 'Vue 3',
  }, {
    value: 'react',
    text: 'React',
  }, {
    value: 'preact',
    text: 'Preact',
  }, {
    value: 'svelte',
    text: 'Svelte',
  }, {
    value: 'solid',
    text: 'Solid JS',
  }, {
    value: 'sveltekit',
    text: 'Svelte Kit (WIP: coming soon)',
    disabled: true,
  }, {
    value: 'vitepress',
    text: 'VitePress',
  }, {
    value: 'iles',
    text: 'Îles',
  }, {
    value: 'astro',
    text: 'Astro (WIP: coming soon)',
    disabled: true,
  }]
}

function createStrategies() {
  return <RadioData<StrategyType>[]>[{
    value: 'generateSW',
    text: 'Generate the service worker for me',
  }, {
    value: 'injectManifest',
    text: 'I want to provide my own service worker',
  }]
}

function createBehaviors() {
  return <RadioData<BehaviorType>[]>[{
    value: 'autoUpdate',
    text: 'Just auto update my application',
  }, {
    value: 'prompt',
    text: 'I want to ask the user before update',
  }]
}

function createWarnReady() {
  return <RadioData<YesNoType>[]>[{
    value: 'true',
    text: 'Yes, I want to inform user',
  }, {
    value: 'false',
    text: 'No, just keep it as simple as possible',
  }]
}

function createTS() {
  return <RadioData<YesNoType>[]>[{
    value: 'true',
    text: 'Yes',
  }, {
    value: 'false',
    text: 'No',
  }]
}

function createInjectRegisters() {
  return <RadioData<InjectRegisterType>[]>[{
    value: 'inline',
    text: 'As simple as possible',
  }, {
    value: 'script',
    text: 'Generate registerSW.js script',
  }]
}