const server = require('../server');

server._router.stack.forEach((layer, idx) => {
  if (layer.name === 'router') {
    console.log(`Layer ${idx}: prefix RegExp: ${layer.regexp.toString()} keys: ${JSON.stringify(layer.keys)}`);
  } else {
    console.log(`Layer ${idx}: name: ${layer.name} path: ${layer.route ? layer.route.path : 'none'}`);
  }
});
process.exit(0);
