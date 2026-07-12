import { definePreset, palette } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

/**
 * Nexus brand palette
 * Coffee Bean       #1a090d — app background
 * Coffee Bean Panel #261318 — elevated panels / sidebar (coffee bean family)
 * Lavender Blush    #f6e8ea — light text & contrast on dark
 * Bubblegum Pink    #ef626c — primary accent
 * Blue Slate        #3d5a6c — informational accent
 * Light Green       #ace894 — success / positive accent
 */
const coffeeBean = palette('#1a090d')
const lavenderBlush = palette('#f6e8ea')
const bubblegumPink = palette('#ef626c')
const blueSlate = palette('#3d5a6c')
const lightGreen = palette('#ace894')

const NexusPreset = definePreset(Aura, {
  primitive: {
    coffeeBean,
    lavenderBlush,
    bubblegumPink,
    blueSlate,
    lightGreen,
    // Severity accents used by Message, Tag, Badge, etc.
    blue: blueSlate,
    green: lightGreen,
  },
  semantic: {
    primary: {
      50: '{bubblegumPink.50}',
      100: '{bubblegumPink.100}',
      200: '{bubblegumPink.200}',
      300: '{bubblegumPink.300}',
      400: '{bubblegumPink.400}',
      500: '{bubblegumPink.500}',
      600: '{bubblegumPink.600}',
      700: '{bubblegumPink.700}',
      800: '{bubblegumPink.800}',
      900: '{bubblegumPink.900}',
      950: '{bubblegumPink.950}',
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
      },
    },
  },
})

export default NexusPreset
