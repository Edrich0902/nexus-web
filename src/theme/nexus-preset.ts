import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * PrimeVue preset driven by the ambient CSS variables in src/design/theme.css.
 * Primary follows `--acc` and surfaces are mixed from `--ink` over `--amb`, so
 * every PrimeVue control re-tints with the section or moment automatically.
 */

const ink = (pct: number) => `color-mix(in srgb, var(--ink) ${pct}%, var(--amb))`
const acc = (pct: number, toward: 'ink' | 'amb') =>
  `color-mix(in srgb, var(--acc) ${pct}%, var(--${toward}))`

const transparentBorders = {
  borderColor: 'transparent',
  hoverBorderColor: 'transparent',
  activeBorderColor: 'transparent',
}

const NexusPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '6px',
      sm: '10px',
      md: '14px',
      lg: '18px',
      xl: '22px',
    },
  },
  semantic: {
    primary: {
      50: acc(12, 'ink'),
      100: acc(25, 'ink'),
      200: acc(45, 'ink'),
      300: acc(65, 'ink'),
      400: acc(85, 'ink'),
      500: 'var(--acc)',
      600: acc(85, 'amb'),
      700: acc(70, 'amb'),
      800: acc(55, 'amb'),
      900: acc(40, 'amb'),
      950: acc(25, 'amb'),
    },
    formField: {
      borderRadius: '{border.radius.md}',
      paddingX: '0.9rem',
      paddingY: '0.6rem',
      shadow: 'none',
    },
    content: {
      borderRadius: '{border.radius.lg}',
    },
    overlay: {
      popover: { borderRadius: '{border.radius.md}' },
      modal: { borderRadius: '{border.radius.xl}' },
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fbf5f6',
          100: '#f6e8ea',
          200: '#e9d3d7',
          300: '#d5b8be',
          400: '#b0959b',
          500: '#8a7176',
          600: '#5f4a4f',
          700: '#3f2c31',
          800: '#2b181d',
          900: '#1f0e13',
          950: '#1a090d',
        },
        primary: {
          color: 'var(--acc)',
          contrastColor: 'var(--amb)',
          hoverColor: acc(85, 'ink'),
          activeColor: acc(70, 'ink'),
        },
      },
      dark: {
        surface: {
          0: 'var(--ink)',
          50: ink(92),
          100: ink(84),
          200: ink(72),
          300: ink(60),
          400: ink(48),
          500: ink(36),
          600: ink(26),
          700: ink(18),
          800: ink(11),
          900: ink(6),
          950: 'var(--amb)',
        },
        primary: {
          color: 'var(--acc)',
          contrastColor: 'var(--amb)',
          hoverColor: acc(85, 'ink'),
          activeColor: acc(70, 'ink'),
        },
        highlight: {
          background: 'color-mix(in srgb, var(--acc) 18%, transparent)',
          focusBackground: 'color-mix(in srgb, var(--acc) 26%, transparent)',
          color: 'var(--ink)',
          focusColor: 'var(--ink)',
        },
        formField: {
          background: 'var(--tint)',
          disabledBackground: 'color-mix(in srgb, var(--ink) 3%, transparent)',
          filledBackground: 'var(--tint)',
          filledHoverBackground: 'var(--tint-2)',
          filledFocusBackground: 'var(--tint-2)',
          borderColor: 'var(--line)',
          hoverBorderColor: 'var(--line-strong)',
          focusBorderColor: 'var(--acc)',
          color: 'var(--ink)',
          placeholderColor: 'var(--ink-3)',
          floatLabelColor: 'var(--ink-3)',
          floatLabelFocusColor: 'var(--acc)',
          iconColor: 'var(--ink-3)',
          shadow: 'none',
        },
        content: {
          background: 'var(--surface)',
          hoverBackground: 'var(--surface-2)',
          borderColor: 'var(--line)',
          color: 'var(--ink)',
          hoverColor: 'var(--ink)',
        },
        overlay: {
          select: {
            background: 'var(--overlay)',
            borderColor: 'var(--line)',
            color: 'var(--ink)',
          },
          popover: {
            background: 'var(--overlay)',
            borderColor: 'var(--line)',
            color: 'var(--ink)',
          },
          modal: {
            background: 'var(--overlay)',
            borderColor: 'var(--line)',
            color: 'var(--ink)',
          },
        },
        list: {
          option: {
            focusBackground: 'var(--tint-2)',
            selectedBackground: 'color-mix(in srgb, var(--acc) 18%, transparent)',
            selectedFocusBackground: 'color-mix(in srgb, var(--acc) 26%, transparent)',
            color: 'var(--ink)',
            focusColor: 'var(--ink)',
            selectedColor: 'var(--ink)',
            selectedFocusColor: 'var(--ink)',
          },
        },
        navigation: {
          item: {
            focusBackground: 'var(--tint-2)',
            activeBackground: 'var(--tint-2)',
            color: 'var(--ink-2)',
            focusColor: 'var(--ink)',
            activeColor: 'var(--ink)',
          },
        },
        text: {
          color: 'var(--ink)',
          hoverColor: 'var(--ink)',
          mutedColor: 'var(--ink-3)',
          hoverMutedColor: 'var(--ink-2)',
        },
        mask: {
          background: 'rgba(0, 0, 0, 0.5)',
          color: 'var(--ink)',
        },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '999px',
        roundedBorderRadius: '999px',
        paddingX: '1.15rem',
        paddingY: '0.6rem',
        label: { fontWeight: '600' },
      },
      colorScheme: {
        dark: {
          root: {
            primary: transparentBorders,
            secondary: {
              ...transparentBorders,
              background: 'var(--tint-2)',
              hoverBackground: 'color-mix(in srgb, var(--ink) 15%, transparent)',
              activeBackground: 'color-mix(in srgb, var(--ink) 20%, transparent)',
              color: 'var(--ink)',
              hoverColor: 'var(--ink)',
              activeColor: 'var(--ink)',
            },
            success: transparentBorders,
            info: transparentBorders,
            warn: transparentBorders,
            danger: transparentBorders,
            help: transparentBorders,
            contrast: {
              ...transparentBorders,
              background: 'var(--ink)',
              hoverBackground: 'color-mix(in srgb, var(--ink) 88%, var(--amb))',
              activeBackground: 'color-mix(in srgb, var(--ink) 78%, var(--amb))',
              color: 'var(--amb)',
              hoverColor: 'var(--amb)',
              activeColor: 'var(--amb)',
            },
          },
          outlined: {
            primary: { borderColor: 'color-mix(in srgb, var(--acc) 50%, transparent)' },
            secondary: { borderColor: 'var(--line-strong)', color: 'var(--ink)' },
            danger: { borderColor: 'color-mix(in srgb, {red.400}, transparent 45%)' },
          },
          text: {
            secondary: {
              color: 'var(--ink-2)',
              hoverBackground: 'var(--tint-2)',
              activeBackground: 'var(--tint-2)',
            },
          },
        },
      },
    },
    inputtext: { root: { borderRadius: '{border.radius.md}' } },
    textarea: { root: { borderRadius: '{border.radius.md}' } },
    select: { root: { borderRadius: '{border.radius.md}' } },
    dialog: {
      root: { borderRadius: '{border.radius.xl}' },
    },
    tag: {
      root: {
        borderRadius: '999px',
        roundedBorderRadius: '999px',
        fontWeight: '600',
      },
    },
    toast: {
      root: { borderRadius: '{border.radius.md}' },
    },
    skeleton: {
      colorScheme: {
        dark: {
          root: {
            background: 'var(--tint)',
            animationBackground: 'var(--tint-2)',
          },
        },
      },
    },
    datatable: {
      headerCell: { background: 'transparent', color: 'var(--ink-3)', borderColor: 'var(--line)' },
      row: { background: 'transparent', hoverBackground: 'var(--tint)', color: 'var(--ink)' },
      bodyCell: { borderColor: 'var(--line)' },
    },
  },
})

export default NexusPreset
