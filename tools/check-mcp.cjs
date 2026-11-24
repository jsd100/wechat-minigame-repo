const { spawn } = require('node:child_process');
const { writeFileSync, mkdirSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
async function verify(service) {
  const child = spawn(path.join(root, '.tooling/bin/mini-ai-mcp'), [service], { cwd: root, env: { ...process.env, NO_COLOR: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', id = 0;
  const pending = new Map();
  const timer = setTimeout(() => child.kill('SIGTERM'), 45000);
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-10000); });
  child.stdout.on('data', chunk => {
    stdout += chunk;
    let index;
    while ((index = stdout.indexOf('\n')) >= 0) {
      const line = stdout.slice(0, index).trim(); stdout = stdout.slice(index + 1);
      if (!line) continue;
      try { const reply = JSON.parse(line); if (reply.id !== undefined && pending.has(reply.id)) { pending.get(reply.id)(reply); pending.delete(reply.id); } } catch {}
    }
  });
  const exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  function rpc(method, params) {
    return new Promise((resolve, reject) => {
      const requestId = ++id;
      const timeout = setTimeout(() => reject(new Error(service + ' ' + method + ' timed out; stderr: ' + stderr.slice(-1200))), 20000);
      pending.set(requestId, reply => { clearTimeout(timeout); resolve(reply); });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }) + '\n');
    });
  }
  try {
    const initialized = await rpc('initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'DeepSeekHarness', version: '1.0.0' } });
    if (initialized.error) throw new Error(JSON.stringify(initialized.error));
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');
    const listed = await rpc('tools/list', {});
    if (listed.error || !Array.isArray(listed.result?.tools)) throw new Error(JSON.stringify(listed));
    const names = listed.result.tools.map(tool => tool.name);
    console.log(service, 'initialize OK; tools:', names.length);
    const matching = service === 'cloudbase' ? names.filter(name => /auth|env/i.test(name)) : service === 'wechatide' ? names.filter(name => /project_list/.test(name)) : [];
    console.log(service, 'selected read-only tools:', matching);
    for (const tool of listed.result.tools.filter(tool => matching.includes(tool.name))) console.log(service, tool.name, JSON.stringify(tool.inputSchema));
    if (service === 'cloudbase') {
      const reply = await rpc('tools/call', { name: 'auth', arguments: { action: 'status' } });
      console.log('cloudbase auth(status):', JSON.stringify(reply));
      if (reply.error || reply.result?.isError) throw new Error('CloudBase auth(status) failed');
    }
    if (service === 'wechatide') {
      const reply = await rpc('tools/call', { name: 'project_list', arguments: {} });
      console.log('wechatide project_list:', JSON.stringify(reply));
      if (reply.error || reply.result?.isError) throw new Error('WeChat project_list failed');
    }
    return { service, initialized: initialized.result?.serverInfo, tools: names, schemas: listed.result.tools.filter(tool => matching.includes(tool.name)).map(tool => ({ name: tool.name, inputSchema: tool.inputSchema })) };
  } finally {
    clearTimeout(timer); child.kill('SIGTERM');
    await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 1500))]);
  }
}
(async () => {
  const reports = [];
  for (const service of process.argv.slice(2)) reports.push(await verify(service));
  mkdirSync(path.join(root, '.tooling/local/checks'), { recursive: true });
  writeFileSync(path.join(root, '.tooling/local/checks/mcp-handshakes.json'), JSON.stringify(reports, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
