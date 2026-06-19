module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@app": "./src/app",
            "@navigation": "./src/navigation",
            "@theme": "./src/theme",
            "@i18n": "./src/i18n",
            "@components": "./src/components",
            "@features": "./src/features",
            "@services": "./src/services",
            "@data": "./src/data",
            "@hooks": "./src/hooks",
            "@domain": "./src/types",
          },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
    ],
  };
};
