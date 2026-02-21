// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Resolve Node.js built-in modules as empty for React Native
// Axios CJS bundle references these but the browser/RN adapter doesn't need them
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const nodeBuiltins = new Set([
    'crypto',
    'http',
    'http2',
    'https',
    'url',
    'stream',
    'zlib',
    'assert',
    'util',
    'net',
    'tls',
    'events',
    'querystring',
    'path',
    'fs',
    'os',
    'child_process',
    'dns',
    'dgram',
    'cluster',
    'module',
    'readline',
    'repl',
    'tty',
    'v8',
    'vm',
    'worker_threads',
  ]);

  if (nodeBuiltins.has(moduleName)) {
    return { type: 'empty' };
  }

  // Let Metro handle everything else normally
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
