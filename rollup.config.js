import terser from '@rollup/plugin-terser';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

export default [
    // ESM build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/pendo-guide-components.esm.js',
            format: 'esm',
            sourcemap: true
        },
        plugins: [
            css({ output: 'pendo-guide-components.css' }),
            production && terser()
        ]
    },
    // IIFE build for CDN/script tag usage
    {
        input: 'src/index.js',
        output: {
            file: 'dist/pendo-guide-components.js',
            format: 'iife',
            name: 'PendoGuideComponents',
            sourcemap: true
        },
        plugins: [
            css({ output: false }), // CSS already output by ESM build
            production && terser()
        ]
    }
];
