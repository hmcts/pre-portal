export default {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        modules: false, // Changed to false for ESM
      },
    ],
  ],
};
