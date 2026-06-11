import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const packageDir = join(process.cwd(), 'node_modules', 'moomoo-api');
const mainPath = join(packageDir, 'main.js');
const basePath = join(packageDir, 'base.js');

function patchFile(filePath, replacements) {
  if (!existsSync(filePath)) {
    return;
  }

  let source = readFileSync(filePath, 'utf8');
  source = source.replace(/\r\n/g, '\n');
  const original = source;

  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }

  if (source !== original) {
    writeFileSync(filePath, source);
  }
}

patchFile(mainPath, [
  ["import mmWebsocketBase from './base.js'\n", "const mmWebsocketBase = require('./base.js');\n"],
  ['import protoRoot from "./proto.js";\n', "const protoRoot = require('./proto.js');\n"],
  ['import protobuf from "protobufjs";\n', "const protobuf = require('protobufjs');\n"],
  ['import crypto from "crypto";\n', "const crypto = require('crypto');\n"],
  ['import long from "long"\n', "const long = require('long');\n"],
  ['export const mmCmdID = ', 'const mmCmdID = '],
  ['export default mmWebsocket', 'module.exports = mmWebsocket;\nmodule.exports.default = mmWebsocket;\nmodule.exports.mmCmdID = mmCmdID;'],
]);

patchFile(basePath, [
  ["import util from 'util'\n", "const util = require('util');\n"],
  ["import bytebuffer from 'bytebuffer'\n", "const bytebuffer = require('bytebuffer');\n"],
  ['import protobuf from "protobufjs";\n', "const protobuf = require('protobufjs');\n"],
  ['import protoRoot from "./proto.js";\n', "const protoRoot = require('./proto.js');\n"],
  ['export default mmWebsocketBase', 'module.exports = mmWebsocketBase;\nmodule.exports.default = mmWebsocketBase;'],
]);
