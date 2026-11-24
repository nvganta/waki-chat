const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const wakeStyle = require('../dist/services/wake-style');

function load(relative, imports) {
  const filename = path.join(__dirname, '../src', relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, {
    module, exports: module.exports, console, Date,
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
      return imports[name];
    },
  }, { filename });
  return module.exports;
}

test('wake-up style persists for new and existing preference records', async () => {
  let saves = 0;
  const dbService = { alarms: [], userPreferences: {}, async save() { saves++; } };
  const { alarmService } = load('services/alarm.service.ts', {
    './db.service': { dbService }, uuid: { v4: () => 'test-id' },
  });
  const created = await alarmService.updateUserPreferences('user', { wakeUpStyle: 'gentle' });
  assert.equal(created.wakeUpStyle, 'gentle');
  await alarmService.updateUserPreferences('user', { wakeUpStyle: 'assertive' });
  assert.equal((await alarmService.getUserPreferences('user')).wakeUpStyle, 'assertive');
  assert.equal(saves, 2);
});

test('API rejects invalid styles before saving preferences', async () => {
  let saves = 0;
  const { preferencesController } = load('controllers/preferences.controller.ts', {
    '../services/alarm.service': { alarmService: { async updateUserPreferences() { saves++; } } },
    '../services/wake-style': wakeStyle,
  });
  const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await preferencesController.updatePreferences({ userId: 'user', body: { wakeUpStyle: 'invalid' } }, response);
  assert.equal(response.code, 400);
  assert.equal(saves, 0);
});

test('the real message generator includes the stored wake-up approach', async () => {
  let prompt;
  const { aiService } = load('services/ai.service.ts', {
    '../config/openai': { openai: {} },
    fs: {}, path: {}, uuid: { v4: () => 'unused' },
    './friendli.service': { async getFriendliCompletion(value) { prompt = value; return 'Good morning'; } },
    './wake-style': wakeStyle,
  });
  const message = await aiService.generateWakeUpMessage('Reader',
    { city: 'Example', temperature: 20, description: 'clear' },
    { voiceStyle: 'friendly', wakeUpStyle: 'gentle' });
  assert.equal(message, 'Good morning');
  assert.match(prompt, /Wake them gradually/);
});

test('saved alarm greeting uses pacing and survives an unavailable AI provider', async () => {
  let fail = false;
  let prompt;
  const { aiService } = load('services/ai.service.ts', {
    '../config/openai': { openai: {} }, fs: {}, path: {}, uuid: {},
    './friendli.service': { async getFriendliCompletion(value) {
      prompt = value;
      if (fail) throw new Error('offline');
      return 'Good morning, Alice.';
    } },
    './wake-style': wakeStyle,
  });
  const preferences = {name: 'Alice', wakeUpStyle: 'gentle'};
  assert.equal(await aiService.prepareAlarmMessage(preferences), 'Good morning, Alice.');
  assert.match(prompt, /Wake them gradually/);
  assert.match(prompt, /future alarm/);
  fail = true;
  assert.match(await aiService.prepareAlarmMessage(preferences), /Good morning, Alice/);
});

test('saved-message endpoint requires preferences and does not fetch live weather', async () => {
  let preferences = null;
  const { aiController } = load('controllers/ai.controller.ts', {
    '../services/ai.service': {aiService: {prepareAlarmMessage: async p => `Hello ${p.name}`}},
    '../services/alarm.service': {alarmService: {getUserPreferences: async () => preferences}},
    '../services/weather.service': {}, multer: {default: () => ({})}, fs: {},
  });
  const response = () => ({status(code) {this.code = code; return this;}, json(body) {this.body = body; return this;}});
  let res = response();
  await aiController.prepareAlarmMessage({userId: 'alice'}, res);
  assert.equal(res.code, 404);
  preferences = {name: 'Alice'};
  res = response();
  await aiController.prepareAlarmMessage({userId: 'alice'}, res);
  assert.equal(res.body.message, 'Hello Alice');
});
