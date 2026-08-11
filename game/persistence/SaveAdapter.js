/**
 * Duck-typed adapter interface - any object implementing these three
 * methods satisfies it. No class/interface enforcement needed in plain JS.
 * @typedef {Object} SaveAdapter
 * @property {() => Promise<import('../types/save.js').SaveFileV1|null>} load
 * @property {(data: import('../types/save.js').SaveFileV1) => Promise<void>} save
 * @property {() => Promise<void>} clear
 */

export {}
