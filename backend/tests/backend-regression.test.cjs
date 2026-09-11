const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-compiled.cjs');
const wakeStyle = require('../dist/services/wake-style');
const plain = value => JSON.parse(JSON.stringify(value));
const response = () => ({
  code: 200, sends: 0,
  status(code) { this.code = code; return this; },
  json(body) { this.body = body; this.sends++; return this; },
  send(body) { return this.json(body); },
});

test('journal insert returns its UUID, queries stay scoped and newest first', async () => {
  const requests = [];
  const filter = { byProperty: property => ({
    equal: value => ({ operator: 'Equal', target: { property }, value }),
    greaterThan: value => ({ operator: 'GreaterThan', target: { property }, value }),
  }) };
  const journal = {
    filter, sort: { byProperty: (property, ascending) => ({ property, ascending }) },
    data: { insert: async () => 'entry-uuid' },
    query: {
      fetchObjects: async options => { requests.push(options); return { objects: [] }; },
      nearText: async (query, options) => { requests.push({ query, ...options }); return { objects: [] }; },
    },
    aggregate: { groupBy: { overAll: async options => { requests.push(options); return []; } } },
  };
  const { journalService } = load('services/journal.service.js', {
    '../config/weaviate': { getWeaviateClient: async () => ({ collections: { get: () => journal } }) },
    'weaviate-client': require('weaviate-client'),
    './friendli.service': { getFriendliCompletion: async () => { throw new Error('Unexpected AI request'); } },
  });
  assert.equal(await journalService.createEntry({ userId: 'alice', content: 'Morning', mood: 'calm', sentiment: 0, createdAt: new Date() }), 'entry-uuid');
  await journalService.getEntries('alice', 12);
  await journalService.searchEntries('alice', 'morning', 4);
  await journalService.getMoodStats('alice', 7);
  for (const request of requests.slice(0, 2)) {
    assert.equal(request.filters.target.property, 'userId');
    assert.equal(request.filters.value, 'alice');
    assert.equal('where' in request, false);
  }
  assert.deepEqual(plain(requests[0].sort), { property: 'createdAt', ascending: false });
  assert.equal(requests[0].limit, 12);
  assert.equal(requests[1].query, 'morning');
  assert.equal(requests[2].groupBy.property, 'mood');
  assert.equal(requests[2].filters.operator, 'And');
  assert.equal(requests[2].filters.filters[0].value, 'alice');
  assert.ok(requests[2].filters.filters[1].value instanceof Date);
});

function voiceService(sdk, axios = {}, overrides = {}) {
  return load('services/vapi.service.js', {
    '@vapi-ai/server-sdk': { VapiClient: class { constructor(options) { assert.equal(options.token, 'test'); return sdk; } } },
    axios, dotenv: { config() {} }, './wake-style': wakeStyle,
  }, { VAPI_API_KEY: 'test', FRIENDLI_ENDPOINT: 'https://example.invalid/v1', FRIENDLI_MODEL: 'test-model', VAPI_PHONE_NUMBER_ID: 'outgoing-id', ...overrides }).vapiService;
}
const context = { userName: 'Alice', currentTime: '7:00 AM', preferences: { wakeUpStyle: 'gentle' } };

test('Vapi separates outgoing number ID from recipient and carries wake-up pacing', async () => {
  let assistant, request;
  const service = voiceService({
    assistants: { create: async value => { assistant = value; return { id: 'assistant-id' }; } },
    calls: { create: async value => { request = value; return { id: 'call-id', status: 'queued' }; } },
  });
  assert.equal((await service.createPhoneCall('+15555550100', context)).id, 'call-id');
  assert.equal(request.phoneNumberId, 'outgoing-id');
  assert.equal(request.customer.number, '+15555550100');
  assert.equal(assistant.model.url, 'https://example.invalid/v1');
  assert.match(assistant.model.messages[0].content, /Wake them gradually/);
  assert.equal(assistant.voice.provider, '11labs');
  assert.equal(assistant.monitorPlan.controlEnabled, true);
});

test('Vapi rejects missing phone configuration before creating anything', async () => {
  const service = voiceService({}, {}, { VAPI_PHONE_NUMBER_ID: '' });
  await assert.rejects(service.createPhoneCall('+15555550100', context), /Failed to initiate call/);
});

test('web preparation creates private context without fabricating a media URL', async () => {
  let creates = 0;
  const service = voiceService({ assistants: { create: async () => ({ id: `assistant-${++creates}` }) } }, {}, { VAPI_ASSISTANT_ID: 'shared' });
  assert.deepEqual(plain(await service.createWebCall(context)), { assistantId: 'assistant-1' });
  assert.deepEqual(plain(await service.createWebCall({ ...context, userName: 'Bob' })), { assistantId: 'assistant-2' });
});

test('ending calls uses live control and propagates failures', async () => {
  const sent = [];
  let call = { status: 'in-progress', monitor: { controlUrl: 'https://example.invalid/control' } };
  const service = voiceService({ calls: { get: async () => call } }, {
    post: async (...args) => { sent.push(args); throw new Error('Provider unavailable'); },
  });
  await assert.rejects(service.endCall('call-id'), /Provider unavailable/);
  assert.equal(sent[0][0], call.monitor.controlUrl);
  assert.deepEqual(plain(sent[0][1]), { type: 'end-call' });
  call = { status: 'ended' };
  await service.endCall('call-id');
  assert.equal(sent.length, 1);
  call = { status: 'in-progress' };
  await assert.rejects(service.endCall('call-id'), /control is unavailable/);
});

test('transcript comes from call artifacts', async () => {
  const service = voiceService({ calls: { get: async () => ({ artifact: { transcript: 'Good morning' } }) } });
  assert.equal(await service.getCallTranscript('call-id'), 'Good morning');
});

test('empty recordings and missing mood produce finite neutral insights', async () => {
  let entries = [];
  const multer = Object.assign(() => ({}), { diskStorage: () => ({}) });
  const { voiceJournalService } = load('services/voiceJournal.service.js', {
    './ai.service': {}, './journal.service': { journalService: { getEntries: async () => entries } },
    uuid: {}, fs: {}, path: {}, multer,
  });
  let result = await voiceJournalService.getAudioInsights('alice');
  assert.equal(result.speakingPatterns.averageLength, 0);
  assert.equal(result.averageMood, 'neutral');
  entries = [{ audioUrl: '/sample', content: 'Feeling rested today', createdAt: new Date() }];
  result = await voiceJournalService.getAudioInsights('alice');
  assert.equal(result.averageMood, 'neutral');
  assert.equal(result.totalRecordings, 1);
});

test('voice stop/snooze recognition returns once and cleans uploads on success or failure', async () => {
  let transcription = 'stop the alarm', fail = false, cleaned = 0;
  const { aiController } = load('controllers/ai.controller.js', {
    '../services/ai.service': { aiService: { processVoiceCommand: async () => {
      if (fail) throw new Error('Transcription unavailable');
      return transcription;
    } } },
    '../services/weather.service': {}, '../services/alarm.service': {},
    multer: () => ({}), fs: { existsSync: () => true, unlinkSync: () => cleaned++ },
  });
  for (const [text, action] of [['stop the alarm', 'stop'], ['snooze please', 'snooze'], ['hello', 'unknown']]) {
    transcription = text;
    const res = response();
    assert.equal(await aiController.processVoiceCommand({ file: { path: 'test-upload' } }, res), res);
    assert.equal(res.body.action, action);
    assert.equal(res.sends, 1);
  }
  fail = true;
  const res = response();
  await aiController.processVoiceCommand({ file: { path: 'test-upload' } }, res);
  assert.equal(res.code, 500);
  assert.equal(cleaned, 4);
});

test('alarm ownership rejection ends the response without changing an alarm', async () => {
  let writes = 0;
  const { alarmController } = load('controllers/alarm.controller.js', {
    '../services/alarm.service': { alarmService: {
      getAlarm: async () => ({ userId: 'bob' }), updateAlarm: async () => writes++,
    } },
  });
  const res = response();
  assert.equal(await alarmController.updateAlarm({ userId: 'alice', params: { id: 'alarm' }, body: {} }, res), res);
  assert.equal(res.code, 403);
  assert.equal(res.sends, 1);
  assert.equal(writes, 0);
});

test('Friendli rejects malformed or empty completions', async () => {
  let content = 'Good morning';
  const { getFriendliCompletion } = load('services/friendli.service.js', {
    axios: { post: async () => ({ data: { choices: [{ message: { content } }] } }) },
  }, { FRIENDLI_API_KEY: 'test', FRIENDLI_ENDPOINT: 'https://example.invalid', FRIENDLI_MODEL: 'test' });
  assert.equal(await getFriendliCompletion('hello'), 'Good morning');
  for (content of [null, {}, '', '   ']) await assert.rejects(getFriendliCompletion('hello'), /Failed to get completion/);
});
