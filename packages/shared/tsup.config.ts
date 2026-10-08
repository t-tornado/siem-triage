import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    constants: 'src/constants.ts',
    'lib/index': 'src/lib/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
})
