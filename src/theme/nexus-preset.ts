import { definePreset, palette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * Nexus brand palette
 * Coffee Bean       #1a090d — app background
 * Coffee Bean Panel #261318 — elevated panels / sidebar (coffee bean family)
 * Lavender Blush    #f6e8ea — light text & contrast on dark
 * Meadow Green      #5ecf8a — primary accent
 * Blue Slate        #3d5a6c — informational accent
 * Light Green       #ace894 — success / soft positive accent
 */
const coffeeBean = palette('#1a090d')
const lavenderBlush = palette('#f6e8ea')
const meadowGreen = palette('#5ecf8a')
const blueSlate = palette('#3d5a6c')
const lightGreen = palette('#ace894')

const NexusPreset = definePreset(Aura, {
  primitive: {
    coffeeBean,
    lavenderBlush,
    meadowGreen,
    blueSlate,
    lightGreen,
    // Severity accents used by Message, Tag, Badge, etc.
    blue: blueSlate,
    green: lightGreen,
    // Match Nexus card language (~0.75–0.85rem) instead of Aura's tight 6px controls.
    borderRadius: {
      none: '0',
      xs: '0.25rem',
      sm: '0.5rem',
      md: '0.65rem',
      lg: '0.75rem',
      xl: '0.85rem',
    },
  },
  semantic: {
    primary: {
      50: '{meadowGreen.50}',
      100: '{meadowGreen.100}',
      200: '{meadowGreen.200}',
      300: '{meadowGreen.300}',
      400: '{meadowGreen.400}',
      500: '{meadowGreen.500}',
      600: '{meadowGreen.600}',
      700: '{meadowGreen.700}',
      800: '{meadowGreen.800}',
      900: '{meadowGreen.900}',
      950: '{meadowGreen.950}',
    },
    formField: {
      borderRadius: '{border.radius.md}',
      // Drop the faint default inset shadow — reads noisy on coffee-bean surfaces.
      shadow: 'none',
    },
    content: {
      borderRadius: '{border.radius.xl}',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{lavenderBlush.50}',
          100: '{lavenderBlush.100}',
          200: '{lavenderBlush.200}',
          300: '{lavenderBlush.300}',
          400: '{lavenderBlush.400}',
          500: '{lavenderBlush.500}',
          600: '{blueSlate.600}',
          700: '{blueSlate.700}',
          800: '{coffeeBean.800}',
          900: '{coffeeBean.900}',
          950: '{coffeeBean.950}',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
      },
      dark: {
        surface: {
          0: '{lavenderBlush.50}',
          50: '{lavenderBlush.100}',
          100: '{lavenderBlush.200}',
          200: '{lavenderBlush.300}',
          300: '{lavenderBlush.400}',
          400: '{lavenderBlush.500}',
          500: '{blueSlate.400}',
          600: '{blueSlate.500}',
          700: '{coffeeBean.300}',
          800: '{coffeeBean.400}',
          900: '{coffeeBean.500}',
          950: '#1a090d',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        formField: {
          borderColor: 'color-mix(in srgb, {surface.0}, transparent 82%)',
          hoverBorderColor: 'color-mix(in srgb, {surface.0}, transparent 70%)',
          focusBorderColor: '{primary.color}',
          shadow: 'none',
        },
      },
    },
  },
  components: {
    button: {
      root: {
        borderRadius: '{border.radius.md}',
        roundedBorderRadius: '9999px',
        label: {
          fontWeight: '600',
        },
      },
      colorScheme: {
        light: {
          root: {
            primary: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            secondary: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
          },
          outlined: {
            primary: {
              borderColor: 'color-mix(in srgb, {primary.color}, transparent 45%)',
            },
            secondary: {
              borderColor: 'color-mix(in srgb, {surface.500}, transparent 55%)',
            },
          },
        },
        dark: {
          root: {
            primary: {
              // Solid fill — no matching 1px edge ring fighting the soft radius.
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            secondary: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            success: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            info: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            warn: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            danger: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            help: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
            contrast: {
              borderColor: 'transparent',
              hoverBorderColor: 'transparent',
              activeBorderColor: 'transparent',
            },
          },
          outlined: {
            primary: {
              borderColor: 'color-mix(in srgb, {primary.color}, transparent 50%)',
            },
            secondary: {
              borderColor: 'color-mix(in srgb, {surface.0}, transparent 82%)',
            },
            danger: {
              borderColor: 'color-mix(in srgb, {red.400}, transparent 45%)',
            },
          },
        },
      },
    },
    inputtext: {
      root: {
        borderRadius: '{border.radius.md}',
      },
    },
    textarea: {
      root: {
        borderRadius: '{border.radius.md}',
      },
    },
    select: {
      root: {
        borderRadius: '{border.radius.md}',
      },
    },
    dialog: {
      root: {
        borderRadius: '{border.radius.xl}',
      },
    },
    tag: {
      root: {
        borderRadius: '{border.radius.sm}',
        roundedBorderRadius: '{border.radius.xl}',
      },
    },
  },
})

export default NexusPreset
