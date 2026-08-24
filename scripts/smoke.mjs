// 冒烟测试：验证浏览器端 bundle 的模块工厂契约，以及宿主端模块可导入。
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

// ---- 宿主端：确认可导入且导出 name/apply ----
const host = await import(pathToFileURL(join(root, 'lib/index.js')).href)
console.log('host.name =', host.name)
console.log('host.apply =', typeof host.apply)
if (host.name !== 'dsh-deepseek-balance' || typeof host.apply !== 'function') {
  throw new Error('host module exports wrong')
}

// ---- 浏览器端：确认 factory 返回 { name, inject, apply } 且 apply 可注册 ----
const code = readFileSync(join(root, 'client/client.js'), 'utf8')
let captured = null
const fakeReact = {
  createElement: (type, props, ...children) => ({ type, props, children }),
  useState: (init) => [init, () => {}],
  useEffect: () => {},
  useCallback: (fn) => fn,
}
const fakeRequire = (spec) => {
  if (spec === 'react') return fakeReact
  throw new Error('unexpected require: ' + spec)
}
const sandbox = {
  window: { __ModuleLoader__: { load: (x) => { captured = x } } },
  require: fakeRequire,
  module: { exports: {} },
  exports: {},
  console,
}
vm.createContext(sandbox)
vm.runInContext(code, sandbox)
if (!captured || captured.id !== 'dsh-deepseek-balance') throw new Error('bundle did not register module')

const exports2 = captured.factory(fakeRequire)
console.log('client.name =', exports2.name)
console.log('client.inject =', JSON.stringify(exports2.inject))
console.log('client.apply =', typeof exports2.apply)
if (exports2.name !== 'dsh-deepseek-balance' || typeof exports2.apply !== 'function') {
  throw new Error('client module exports wrong')
}

// 模拟 ctx，验证 apply 注册了 settings.section
const registered = []
const ctx = {
  effect: (fn) => { fn(); return () => {} },
  locale: { register: () => {}, bind: () => (k) => k },
  slots: {
    inject: (slot, fn) => fn(),
    register: (meta, comp) => { registered.push(meta); return () => {} },
  },
}
exports2.apply(ctx)
console.log('registered slots =', JSON.stringify(registered.map((r) => ({ name: r.name, id: r.id }))))
if (registered.length !== 1 || registered[0].name !== 'settings.section') {
  throw new Error('apply did not register settings.section')
}

console.log('SMOKE OK')
