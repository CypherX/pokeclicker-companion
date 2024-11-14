(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*globals self, window */
"use strict"

/*eslint-disable @mysticatea/prettier */
const { AbortController, AbortSignal } =
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window :
    /* otherwise */ undefined
/*eslint-enable @mysticatea/prettier */

module.exports = AbortController
module.exports.AbortSignal = AbortSignal
module.exports.default = AbortController

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":3,"ieee754":5}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
    function errorListener(err) {
      emitter.removeListener(name, resolver);
      reject(err);
    }

    function resolver() {
      if (typeof emitter.removeListener === 'function') {
        emitter.removeListener('error', errorListener);
      }
      resolve([].slice.call(arguments));
    };

    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
    if (name !== 'error') {
      addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
    }
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
    eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
    if (flags.once) {
      emitter.once(name, listener);
    } else {
      emitter.on(name, listener);
    }
  } else if (typeof emitter.addEventListener === 'function') {
    // EventTarget does not have `error` event semantics like Node
    // EventEmitters, we do not listen for `error` events here.
    emitter.addEventListener(name, function wrapListener(arg) {
      // IE does not have builtin `{ once: true }` support so we
      // have to do it manually.
      if (flags.once) {
        emitter.removeEventListener(name, wrapListener);
      }
      listener(arg);
    });
  } else {
    throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

},{}],5:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],6:[function(require,module,exports){
(function (process,global,Buffer,__argument0,__argument1,__argument2,__argument3,setImmediate){(function (){
/*!
 LZ-UTF8 v0.6.3

 Copyright (c) 2021, Rotem Dan
 Released under the MIT license.

 Build date: 2022-07-06 

 Please report any issue at https://github.com/rotemdan/lzutf8.js/issues
*/
var LZUTF8;
(function (LZUTF8) {
    LZUTF8.runningInNodeJS = function () {
        return ((typeof process === "object") && (typeof process.versions === "object") && (typeof process.versions.node === "string"));
    };
    LZUTF8.runningInMainNodeJSModule = function () {
        return LZUTF8.runningInNodeJS() && require.main === module;
    };
    LZUTF8.commonJSAvailable = function () {
        return typeof module === "object" && typeof module.exports === "object";
    };
    LZUTF8.runningInWebWorker = function () {
        return typeof window === "undefined" && typeof self === "object" && typeof self.addEventListener === "function" && typeof self.close === "function";
    };
    LZUTF8.runningInNodeChildProcess = function () {
        return LZUTF8.runningInNodeJS() && typeof process.send === "function";
    };
    LZUTF8.runningInNullOrigin = function () {
        if (typeof window !== "object" || typeof window.location !== "object" || typeof document !== "object")
            return false;
        return document.location.protocol !== 'http:' && document.location.protocol !== 'https:';
    };
    LZUTF8.webWorkersAvailable = function () {
        if (typeof Worker !== "function" || LZUTF8.runningInNullOrigin())
            return false;
        if (LZUTF8.runningInNodeJS())
            return false;
        if (navigator && navigator.userAgent && navigator.userAgent.indexOf("Android 4.3") >= 0)
            return false;
        return true;
    };
    LZUTF8.log = function (message, appendToDocument) {
        if (appendToDocument === void 0) { appendToDocument = false; }
        if (typeof console !== "object")
            return;
        console.log(message);
        if (appendToDocument && typeof document == "object")
            document.body.innerHTML += message + "<br/>";
    };
    LZUTF8.createErrorMessage = function (exception, title) {
        if (title === void 0) { title = "Unhandled exception"; }
        if (exception == null)
            return title;
        title += ": ";
        if (typeof exception.content === "object") {
            if (LZUTF8.runningInNodeJS()) {
                return title + exception.content.stack;
            }
            else {
                var exceptionJSON = JSON.stringify(exception.content);
                if (exceptionJSON !== "{}")
                    return title + exceptionJSON;
                else
                    return title + exception.content;
            }
        }
        else if (typeof exception.content === "string") {
            return title + exception.content;
        }
        else {
            return title + exception;
        }
    };
    LZUTF8.printExceptionAndStackTraceToConsole = function (exception, title) {
        if (title === void 0) { title = "Unhandled exception"; }
        LZUTF8.log(LZUTF8.createErrorMessage(exception, title));
    };
    LZUTF8.getGlobalObject = function () {
        if (typeof global === "object")
            return global;
        else if (typeof window === "object")
            return window;
        else if (typeof self === "object")
            return self;
        else
            return {};
    };
    LZUTF8.toString = Object.prototype.toString;
    if (LZUTF8.commonJSAvailable())
        module.exports = LZUTF8;
})(LZUTF8 || (LZUTF8 = {}));
var IE10SubarrayBugPatcher;
(function (IE10SubarrayBugPatcher) {
    if (typeof Uint8Array === "function" && new Uint8Array(1).subarray(1).byteLength !== 0) {
        var subarray = function (start, end) {
            var clamp = function (v, min, max) { return v < min ? min : v > max ? max : v; };
            start = start | 0;
            end = end | 0;
            if (arguments.length < 1)
                start = 0;
            if (arguments.length < 2)
                end = this.length;
            if (start < 0)
                start = this.length + start;
            if (end < 0)
                end = this.length + end;
            start = clamp(start, 0, this.length);
            end = clamp(end, 0, this.length);
            var len = end - start;
            if (len < 0)
                len = 0;
            return new this.constructor(this.buffer, this.byteOffset + start * this.BYTES_PER_ELEMENT, len);
        };
        var types = ['Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'];
        var globalObject = void 0;
        if (typeof window === "object")
            globalObject = window;
        else if (typeof self === "object")
            globalObject = self;
        if (globalObject !== undefined) {
            for (var i = 0; i < types.length; i++) {
                if (globalObject[types[i]])
                    globalObject[types[i]].prototype.subarray = subarray;
            }
        }
    }
})(IE10SubarrayBugPatcher || (IE10SubarrayBugPatcher = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncCompressor = (function () {
        function AsyncCompressor() {
        }
        AsyncCompressor.compressAsync = function (input, options, callback) {
            var timer = new LZUTF8.Timer();
            var compressor = new LZUTF8.Compressor();
            if (!callback)
                throw new TypeError("compressAsync: No callback argument given");
            if (typeof input === "string") {
                input = LZUTF8.encodeUTF8(input);
            }
            else if (input == null || !(input instanceof Uint8Array)) {
                callback(undefined, new TypeError("compressAsync: Invalid input argument, only 'string' and 'Uint8Array' are supported"));
                return;
            }
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var compressedBlocks = [];
            var compressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    var compressedBlock = void 0;
                    try {
                        compressedBlock = compressor.compressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    compressedBlocks.push(compressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        compressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedCompressedBlocks_1 = LZUTF8.ArrayTools.concatUint8Arrays(compressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        var result;
                        try {
                            result = LZUTF8.CompressionCommon.encodeCompressedBytes(joinedCompressedBlocks_1, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return compressBlocksStartingAt(0); });
        };
        AsyncCompressor.createCompressionStream = function () {
            var compressor = new LZUTF8.Compressor();
            var NodeStream = require("readable-stream");
            var compressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            compressionStream._transform = function (data, encoding, done) {
                var buffer;
                try {
                    buffer = LZUTF8.BufferTools.uint8ArrayToBuffer(compressor.compressBlock(LZUTF8.BufferTools.bufferToUint8Array(data)));
                }
                catch (e) {
                    compressionStream.emit("error", e);
                    return;
                }
                compressionStream.push(buffer);
                done();
            };
            return compressionStream;
        };
        return AsyncCompressor;
    }());
    LZUTF8.AsyncCompressor = AsyncCompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var AsyncDecompressor = (function () {
        function AsyncDecompressor() {
        }
        AsyncDecompressor.decompressAsync = function (input, options, callback) {
            if (!callback)
                throw new TypeError("decompressAsync: No callback argument given");
            var timer = new LZUTF8.Timer();
            try {
                input = LZUTF8.CompressionCommon.decodeCompressedBytes(input, options.inputEncoding);
            }
            catch (e) {
                callback(undefined, e);
                return;
            }
            var decompressor = new LZUTF8.Decompressor();
            var sourceBlocks = LZUTF8.ArrayTools.splitByteArray(input, options.blockSize);
            var decompressedBlocks = [];
            var decompressBlocksStartingAt = function (index) {
                if (index < sourceBlocks.length) {
                    var decompressedBlock = void 0;
                    try {
                        decompressedBlock = decompressor.decompressBlock(sourceBlocks[index]);
                    }
                    catch (e) {
                        callback(undefined, e);
                        return;
                    }
                    decompressedBlocks.push(decompressedBlock);
                    if (timer.getElapsedTime() <= 20) {
                        decompressBlocksStartingAt(index + 1);
                    }
                    else {
                        LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(index + 1); });
                        timer.restart();
                    }
                }
                else {
                    var joinedDecompressedBlocks_1 = LZUTF8.ArrayTools.concatUint8Arrays(decompressedBlocks);
                    LZUTF8.enqueueImmediate(function () {
                        var result;
                        try {
                            result = LZUTF8.CompressionCommon.encodeDecompressedBytes(joinedDecompressedBlocks_1, options.outputEncoding);
                        }
                        catch (e) {
                            callback(undefined, e);
                            return;
                        }
                        LZUTF8.enqueueImmediate(function () { return callback(result); });
                    });
                }
            };
            LZUTF8.enqueueImmediate(function () { return decompressBlocksStartingAt(0); });
        };
        AsyncDecompressor.createDecompressionStream = function () {
            var decompressor = new LZUTF8.Decompressor();
            var NodeStream = require("readable-stream");
            var decompressionStream = new NodeStream.Transform({ decodeStrings: true, highWaterMark: 65536 });
            decompressionStream._transform = function (data, encoding, done) {
                var buffer;
                try {
                    buffer = LZUTF8.BufferTools.uint8ArrayToBuffer(decompressor.decompressBlock(LZUTF8.BufferTools.bufferToUint8Array(data)));
                }
                catch (e) {
                    decompressionStream.emit("error", e);
                    return;
                }
                decompressionStream.push(buffer);
                done();
            };
            return decompressionStream;
        };
        return AsyncDecompressor;
    }());
    LZUTF8.AsyncDecompressor = AsyncDecompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var WebWorker;
    (function (WebWorker) {
        WebWorker.compressAsync = function (input, options, callback) {
            if (options.inputEncoding == "ByteArray") {
                if (!(input instanceof Uint8Array)) {
                    callback(undefined, new TypeError("compressAsync: input is not a Uint8Array"));
                    return;
                }
            }
            var request = {
                token: Math.random().toString(),
                type: "compress",
                data: input,
                inputEncoding: options.inputEncoding,
                outputEncoding: options.outputEncoding
            };
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (response.type == "error")
                    callback(undefined, new Error(response.error));
                else
                    callback(response.data);
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.postMessage(request, []);
        };
        WebWorker.decompressAsync = function (input, options, callback) {
            var request = {
                token: Math.random().toString(),
                type: "decompress",
                data: input,
                inputEncoding: options.inputEncoding,
                outputEncoding: options.outputEncoding
            };
            var responseListener = function (e) {
                var response = e.data;
                if (!response || response.token != request.token)
                    return;
                WebWorker.globalWorker.removeEventListener("message", responseListener);
                if (response.type == "error")
                    callback(undefined, new Error(response.error));
                else
                    callback(response.data);
            };
            WebWorker.globalWorker.addEventListener("message", responseListener);
            WebWorker.globalWorker.postMessage(request, []);
        };
        WebWorker.installWebWorkerIfNeeded = function () {
            if (typeof self == "object" && self.document === undefined && self.addEventListener != undefined) {
                self.addEventListener("message", function (e) {
                    var request = e.data;
                    if (request.type == "compress") {
                        var compressedData = void 0;
                        try {
                            compressedData = LZUTF8.compress(request.data, { outputEncoding: request.outputEncoding });
                        }
                        catch (e) {
                            self.postMessage({ token: request.token, type: "error", error: LZUTF8.createErrorMessage(e) }, []);
                            return;
                        }
                        var response = {
                            token: request.token,
                            type: "compressionResult",
                            data: compressedData,
                            encoding: request.outputEncoding,
                        };
                        if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
                            self.postMessage(response, [response.data.buffer]);
                        else
                            self.postMessage(response, []);
                    }
                    else if (request.type == "decompress") {
                        var decompressedData = void 0;
                        try {
                            decompressedData = LZUTF8.decompress(request.data, { inputEncoding: request.inputEncoding, outputEncoding: request.outputEncoding });
                        }
                        catch (e) {
                            self.postMessage({ token: request.token, type: "error", error: LZUTF8.createErrorMessage(e) }, []);
                            return;
                        }
                        var response = {
                            token: request.token,
                            type: "decompressionResult",
                            data: decompressedData,
                            encoding: request.outputEncoding,
                        };
                        if (response.data instanceof Uint8Array && navigator.appVersion.indexOf("MSIE 10") === -1)
                            self.postMessage(response, [response.data.buffer]);
                        else
                            self.postMessage(response, []);
                    }
                });
                self.addEventListener("error", function (e) {
                    LZUTF8.log(LZUTF8.createErrorMessage(e.error, "Unexpected LZUTF8 WebWorker exception"));
                });
            }
        };
        WebWorker.createGlobalWorkerIfNeeded = function () {
            if (WebWorker.globalWorker)
                return true;
            if (!LZUTF8.webWorkersAvailable())
                return false;
            if (!WebWorker.scriptURI && typeof document === "object") {
                var scriptElement = document.getElementById("lzutf8");
                if (scriptElement != null)
                    WebWorker.scriptURI = scriptElement.getAttribute("src") || undefined;
            }
            if (WebWorker.scriptURI) {
                WebWorker.globalWorker = new Worker(WebWorker.scriptURI);
                return true;
            }
            else {
                return false;
            }
        };
        WebWorker.terminate = function () {
            if (WebWorker.globalWorker) {
                WebWorker.globalWorker.terminate();
                WebWorker.globalWorker = undefined;
            }
        };
    })(WebWorker = LZUTF8.WebWorker || (LZUTF8.WebWorker = {}));
    WebWorker.installWebWorkerIfNeeded();
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArraySegment = (function () {
        function ArraySegment(container, startPosition, length) {
            this.container = container;
            this.startPosition = startPosition;
            this.length = length;
        }
        ArraySegment.prototype.get = function (index) {
            return this.container[this.startPosition + index];
        };
        ArraySegment.prototype.getInReversedOrder = function (reverseIndex) {
            return this.container[this.startPosition + this.length - 1 - reverseIndex];
        };
        ArraySegment.prototype.set = function (index, value) {
            this.container[this.startPosition + index] = value;
        };
        return ArraySegment;
    }());
    LZUTF8.ArraySegment = ArraySegment;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ArrayTools;
    (function (ArrayTools) {
        ArrayTools.copyElements = function (source, sourceIndex, destination, destinationIndex, count) {
            while (count--)
                destination[destinationIndex++] = source[sourceIndex++];
        };
        ArrayTools.zeroElements = function (collection, index, count) {
            while (count--)
                collection[index++] = 0;
        };
        ArrayTools.countNonzeroValuesInArray = function (array) {
            var result = 0;
            for (var i = 0; i < array.length; i++)
                if (array[i])
                    result++;
            return result;
        };
        ArrayTools.truncateStartingElements = function (array, truncatedLength) {
            if (array.length <= truncatedLength)
                throw new RangeError("truncateStartingElements: Requested length should be smaller than array length");
            var sourcePosition = array.length - truncatedLength;
            for (var i = 0; i < truncatedLength; i++)
                array[i] = array[sourcePosition + i];
            array.length = truncatedLength;
        };
        ArrayTools.doubleByteArrayCapacity = function (array) {
            var newArray = new Uint8Array(array.length * 2);
            newArray.set(array);
            return newArray;
        };
        ArrayTools.concatUint8Arrays = function (arrays) {
            var totalLength = 0;
            for (var _i = 0, arrays_1 = arrays; _i < arrays_1.length; _i++) {
                var array = arrays_1[_i];
                totalLength += array.length;
            }
            var result = new Uint8Array(totalLength);
            var offset = 0;
            for (var _a = 0, arrays_2 = arrays; _a < arrays_2.length; _a++) {
                var array = arrays_2[_a];
                result.set(array, offset);
                offset += array.length;
            }
            return result;
        };
        ArrayTools.splitByteArray = function (byteArray, maxPartLength) {
            var result = [];
            for (var offset = 0; offset < byteArray.length;) {
                var blockLength = Math.min(maxPartLength, byteArray.length - offset);
                result.push(byteArray.subarray(offset, offset + blockLength));
                offset += blockLength;
            }
            return result;
        };
    })(ArrayTools = LZUTF8.ArrayTools || (LZUTF8.ArrayTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var BufferTools;
    (function (BufferTools) {
        BufferTools.convertToUint8ArrayIfNeeded = function (input) {
            if (typeof Buffer === "function" && Buffer.isBuffer(input))
                return BufferTools.bufferToUint8Array(input);
            else
                return input;
        };
        BufferTools.uint8ArrayToBuffer = function (arr) {
            if (Buffer.prototype instanceof Uint8Array) {
                var arrClone = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
                Object["setPrototypeOf"](arrClone, Buffer.prototype);
                return arrClone;
            }
            else {
                var len = arr.length;
                var buf = new Buffer(len);
                for (var i = 0; i < len; i++)
                    buf[i] = arr[i];
                return buf;
            }
        };
        BufferTools.bufferToUint8Array = function (buf) {
            if (Buffer.prototype instanceof Uint8Array) {
                return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"]);
            }
            else {
                var len = buf.length;
                var arr = new Uint8Array(len);
                for (var i = 0; i < len; i++)
                    arr[i] = buf[i];
                return arr;
            }
        };
    })(BufferTools = LZUTF8.BufferTools || (LZUTF8.BufferTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressionCommon;
    (function (CompressionCommon) {
        CompressionCommon.getCroppedBuffer = function (buffer, cropStartOffset, cropLength, additionalCapacity) {
            if (additionalCapacity === void 0) { additionalCapacity = 0; }
            var croppedBuffer = new Uint8Array(cropLength + additionalCapacity);
            croppedBuffer.set(buffer.subarray(cropStartOffset, cropStartOffset + cropLength));
            return croppedBuffer;
        };
        CompressionCommon.getCroppedAndAppendedByteArray = function (bytes, cropStartOffset, cropLength, byteArrayToAppend) {
            return LZUTF8.ArrayTools.concatUint8Arrays([bytes.subarray(cropStartOffset, cropStartOffset + cropLength), byteArrayToAppend]);
        };
        CompressionCommon.detectCompressionSourceEncoding = function (input) {
            if (input == null)
                throw new TypeError("detectCompressionSourceEncoding: input is null or undefined");
            if (typeof input === "string")
                return "String";
            else if (input instanceof Uint8Array || (typeof Buffer === "function" && Buffer.isBuffer(input)))
                return "ByteArray";
            else
                throw new TypeError("detectCompressionSourceEncoding: input must be of type 'string', 'Uint8Array' or 'Buffer'");
        };
        CompressionCommon.encodeCompressedBytes = function (compressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "ByteArray":
                    return compressedBytes;
                case "Buffer":
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(compressedBytes);
                case "Base64":
                    return LZUTF8.encodeBase64(compressedBytes);
                case "BinaryString":
                    return LZUTF8.encodeBinaryString(compressedBytes);
                case "StorageBinaryString":
                    return LZUTF8.encodeStorageBinaryString(compressedBytes);
                default:
                    throw new TypeError("encodeCompressedBytes: invalid output encoding requested");
            }
        };
        CompressionCommon.decodeCompressedBytes = function (compressedData, inputEncoding) {
            if (inputEncoding == null)
                throw new TypeError("decodeCompressedData: Input is null or undefined");
            switch (inputEncoding) {
                case "ByteArray":
                case "Buffer":
                    var normalizedBytes = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(compressedData);
                    if (!(normalizedBytes instanceof Uint8Array))
                        throw new TypeError("decodeCompressedData: 'ByteArray' or 'Buffer' input type was specified but input is not a Uint8Array or Buffer");
                    return normalizedBytes;
                case "Base64":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'Base64' input type was specified but input is not a string");
                    return LZUTF8.decodeBase64(compressedData);
                case "BinaryString":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'BinaryString' input type was specified but input is not a string");
                    return LZUTF8.decodeBinaryString(compressedData);
                case "StorageBinaryString":
                    if (typeof compressedData !== "string")
                        throw new TypeError("decodeCompressedData: 'StorageBinaryString' input type was specified but input is not a string");
                    return LZUTF8.decodeStorageBinaryString(compressedData);
                default:
                    throw new TypeError("decodeCompressedData: invalid input encoding requested: '".concat(inputEncoding, "'"));
            }
        };
        CompressionCommon.encodeDecompressedBytes = function (decompressedBytes, outputEncoding) {
            switch (outputEncoding) {
                case "String":
                    return LZUTF8.decodeUTF8(decompressedBytes);
                case "ByteArray":
                    return decompressedBytes;
                case "Buffer":
                    if (typeof Buffer !== "function")
                        throw new TypeError("encodeDecompressedBytes: a 'Buffer' type was specified but is not supported at the current envirnment");
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(decompressedBytes);
                default:
                    throw new TypeError("encodeDecompressedBytes: invalid output encoding requested");
            }
        };
    })(CompressionCommon = LZUTF8.CompressionCommon || (LZUTF8.CompressionCommon = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var EventLoop;
    (function (EventLoop) {
        var queuedFunctions = [];
        var asyncFlushFunc;
        EventLoop.enqueueImmediate = function (func) {
            queuedFunctions.push(func);
            if (queuedFunctions.length === 1) {
                asyncFlushFunc();
            }
        };
        EventLoop.initializeScheduler = function () {
            var flush = function () {
                for (var _i = 0, queuedFunctions_1 = queuedFunctions; _i < queuedFunctions_1.length; _i++) {
                    var func = queuedFunctions_1[_i];
                    try {
                        func.call(undefined);
                    }
                    catch (exception) {
                        LZUTF8.printExceptionAndStackTraceToConsole(exception, "enqueueImmediate exception");
                    }
                }
                queuedFunctions.length = 0;
            };
            if (LZUTF8.runningInNodeJS()) {
                asyncFlushFunc = function () { return setImmediate(function () { return flush(); }); };
            }
            else if (typeof window === "object" && typeof window.addEventListener === "function" && typeof window.postMessage === "function") {
                var token_1 = "enqueueImmediate-" + Math.random().toString();
                window.addEventListener("message", function (event) {
                    if (event.data === token_1)
                        flush();
                });
                var targetOrigin_1;
                if (LZUTF8.runningInNullOrigin())
                    targetOrigin_1 = '*';
                else
                    targetOrigin_1 = window.location.href;
                asyncFlushFunc = function () { return window.postMessage(token_1, targetOrigin_1); };
            }
            else if (typeof MessageChannel === "function" && typeof MessagePort === "function") {
                var channel_1 = new MessageChannel();
                channel_1.port1.onmessage = function () { return flush(); };
                asyncFlushFunc = function () { return channel_1.port2.postMessage(0); };
            }
            else {
                asyncFlushFunc = function () { return setTimeout(function () { return flush(); }, 0); };
            }
        };
        EventLoop.initializeScheduler();
    })(EventLoop = LZUTF8.EventLoop || (LZUTF8.EventLoop = {}));
    LZUTF8.enqueueImmediate = function (func) { return EventLoop.enqueueImmediate(func); };
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var ObjectTools;
    (function (ObjectTools) {
        ObjectTools.override = function (obj, newPropertyValues) {
            return ObjectTools.extend(obj, newPropertyValues);
        };
        ObjectTools.extend = function (obj, newProperties) {
            if (obj == null)
                throw new TypeError("obj is null or undefined");
            if (typeof obj !== "object")
                throw new TypeError("obj is not an object");
            if (newProperties == null)
                newProperties = {};
            if (typeof newProperties !== "object")
                throw new TypeError("newProperties is not an object");
            if (newProperties != null) {
                for (var property in newProperties)
                    obj[property] = newProperties[property];
            }
            return obj;
        };
    })(ObjectTools = LZUTF8.ObjectTools || (LZUTF8.ObjectTools = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    LZUTF8.getRandomIntegerInRange = function (low, high) {
        return low + Math.floor(Math.random() * (high - low));
    };
    LZUTF8.getRandomUTF16StringOfLength = function (length) {
        var randomString = "";
        for (var i = 0; i < length; i++) {
            var randomCodePoint = void 0;
            do {
                randomCodePoint = LZUTF8.getRandomIntegerInRange(0, 0x10FFFF + 1);
            } while (randomCodePoint >= 0xD800 && randomCodePoint <= 0xDFFF);
            randomString += LZUTF8.Encoding.CodePoint.decodeToString(randomCodePoint);
        }
        return randomString;
    };
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var StringBuilder = (function () {
        function StringBuilder(outputBufferCapacity) {
            if (outputBufferCapacity === void 0) { outputBufferCapacity = 1024; }
            this.outputBufferCapacity = outputBufferCapacity;
            this.outputPosition = 0;
            this.outputString = "";
            this.outputBuffer = new Uint16Array(this.outputBufferCapacity);
        }
        StringBuilder.prototype.appendCharCode = function (charCode) {
            this.outputBuffer[this.outputPosition++] = charCode;
            if (this.outputPosition === this.outputBufferCapacity)
                this.flushBufferToOutputString();
        };
        StringBuilder.prototype.appendCharCodes = function (charCodes) {
            for (var i = 0, length_1 = charCodes.length; i < length_1; i++)
                this.appendCharCode(charCodes[i]);
        };
        StringBuilder.prototype.appendString = function (str) {
            for (var i = 0, length_2 = str.length; i < length_2; i++)
                this.appendCharCode(str.charCodeAt(i));
        };
        StringBuilder.prototype.appendCodePoint = function (codePoint) {
            if (codePoint <= 0xFFFF) {
                this.appendCharCode(codePoint);
            }
            else if (codePoint <= 0x10FFFF) {
                this.appendCharCode(0xD800 + ((codePoint - 0x10000) >>> 10));
                this.appendCharCode(0xDC00 + ((codePoint - 0x10000) & 1023));
            }
            else
                throw new Error("appendCodePoint: A code point of ".concat(codePoint, " cannot be encoded in UTF-16"));
        };
        StringBuilder.prototype.getOutputString = function () {
            this.flushBufferToOutputString();
            return this.outputString;
        };
        StringBuilder.prototype.flushBufferToOutputString = function () {
            if (this.outputPosition === this.outputBufferCapacity)
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer);
            else
                this.outputString += String.fromCharCode.apply(null, this.outputBuffer.subarray(0, this.outputPosition));
            this.outputPosition = 0;
        };
        return StringBuilder;
    }());
    LZUTF8.StringBuilder = StringBuilder;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Timer = (function () {
        function Timer() {
            this.restart();
        }
        Timer.prototype.restart = function () {
            this.startTime = Timer.getTimestamp();
        };
        Timer.prototype.getElapsedTime = function () {
            return Timer.getTimestamp() - this.startTime;
        };
        Timer.prototype.getElapsedTimeAndRestart = function () {
            var elapsedTime = this.getElapsedTime();
            this.restart();
            return elapsedTime;
        };
        Timer.prototype.logAndRestart = function (title, logToDocument) {
            if (logToDocument === void 0) { logToDocument = true; }
            var elapsedTime = this.getElapsedTime();
            var message = "".concat(title, ": ").concat(elapsedTime.toFixed(3), "ms");
            LZUTF8.log(message, logToDocument);
            this.restart();
            return elapsedTime;
        };
        Timer.getTimestamp = function () {
            if (!this.timestampFunc)
                this.createGlobalTimestampFunction();
            return this.timestampFunc();
        };
        Timer.getMicrosecondTimestamp = function () {
            return Math.floor(Timer.getTimestamp() * 1000);
        };
        Timer.createGlobalTimestampFunction = function () {
            if (typeof process === "object" && typeof process.hrtime === "function") {
                var baseTimestamp_1 = 0;
                this.timestampFunc = function () {
                    var nodeTimeStamp = process.hrtime();
                    var millisecondTime = (nodeTimeStamp[0] * 1000) + (nodeTimeStamp[1] / 1000000);
                    return baseTimestamp_1 + millisecondTime;
                };
                baseTimestamp_1 = Date.now() - this.timestampFunc();
            }
            else if (typeof chrome === "object" && chrome.Interval) {
                var baseTimestamp_2 = Date.now();
                var chromeIntervalObject_1 = new chrome.Interval();
                chromeIntervalObject_1.start();
                this.timestampFunc = function () { return baseTimestamp_2 + chromeIntervalObject_1.microseconds() / 1000; };
            }
            else if (typeof performance === "object" && performance.now) {
                var baseTimestamp_3 = Date.now() - performance.now();
                this.timestampFunc = function () { return baseTimestamp_3 + performance.now(); };
            }
            else if (Date.now) {
                this.timestampFunc = function () { return Date.now(); };
            }
            else {
                this.timestampFunc = function () { return (new Date()).getTime(); };
            }
        };
        return Timer;
    }());
    LZUTF8.Timer = Timer;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Compressor = (function () {
        function Compressor(useCustomHashTable) {
            if (useCustomHashTable === void 0) { useCustomHashTable = true; }
            this.MinimumSequenceLength = 4;
            this.MaximumSequenceLength = 31;
            this.MaximumMatchDistance = 32767;
            this.PrefixHashTableSize = 65537;
            this.inputBufferStreamOffset = 1;
            if (useCustomHashTable && typeof Uint32Array == "function")
                this.prefixHashTable = new LZUTF8.CompressorCustomHashTable(this.PrefixHashTableSize);
            else
                this.prefixHashTable = new LZUTF8.CompressorSimpleHashTable(this.PrefixHashTableSize);
        }
        Compressor.prototype.compressBlock = function (input) {
            if (input === undefined || input === null)
                throw new TypeError("compressBlock: undefined or null input received");
            if (typeof input == "string")
                input = LZUTF8.encodeUTF8(input);
            input = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
            return this.compressUtf8Block(input);
        };
        Compressor.prototype.compressUtf8Block = function (utf8Bytes) {
            if (!utf8Bytes || utf8Bytes.length == 0)
                return new Uint8Array(0);
            var bufferStartingReadOffset = this.cropAndAddNewBytesToInputBuffer(utf8Bytes);
            var inputBuffer = this.inputBuffer;
            var inputBufferLength = this.inputBuffer.length;
            this.outputBuffer = new Uint8Array(utf8Bytes.length);
            this.outputBufferPosition = 0;
            var latestMatchEndPosition = 0;
            for (var readPosition = bufferStartingReadOffset; readPosition < inputBufferLength; readPosition++) {
                var inputValue = inputBuffer[readPosition];
                var withinAMatchedRange = readPosition < latestMatchEndPosition;
                if (readPosition > inputBufferLength - this.MinimumSequenceLength) {
                    if (!withinAMatchedRange)
                        this.outputRawByte(inputValue);
                    continue;
                }
                var targetBucketIndex = this.getBucketIndexForPrefix(readPosition);
                if (!withinAMatchedRange) {
                    var matchLocator = this.findLongestMatch(readPosition, targetBucketIndex);
                    if (matchLocator != null) {
                        this.outputPointerBytes(matchLocator.length, matchLocator.distance);
                        latestMatchEndPosition = readPosition + matchLocator.length;
                        withinAMatchedRange = true;
                    }
                }
                if (!withinAMatchedRange)
                    this.outputRawByte(inputValue);
                var inputStreamPosition = this.inputBufferStreamOffset + readPosition;
                this.prefixHashTable.addValueToBucket(targetBucketIndex, inputStreamPosition);
            }
            return this.outputBuffer.subarray(0, this.outputBufferPosition);
        };
        Compressor.prototype.findLongestMatch = function (matchedSequencePosition, bucketIndex) {
            var bucket = this.prefixHashTable.getArraySegmentForBucketIndex(bucketIndex, this.reusableArraySegmentObject);
            if (bucket == null)
                return null;
            var input = this.inputBuffer;
            var longestMatchDistance;
            var longestMatchLength = 0;
            for (var i = 0; i < bucket.length; i++) {
                var testedSequencePosition = bucket.getInReversedOrder(i) - this.inputBufferStreamOffset;
                var testedSequenceDistance = matchedSequencePosition - testedSequencePosition;
                var lengthToSurpass = void 0;
                if (longestMatchDistance === undefined)
                    lengthToSurpass = this.MinimumSequenceLength - 1;
                else if (longestMatchDistance < 128 && testedSequenceDistance >= 128)
                    lengthToSurpass = longestMatchLength + (longestMatchLength >>> 1);
                else
                    lengthToSurpass = longestMatchLength;
                if (testedSequenceDistance > this.MaximumMatchDistance ||
                    lengthToSurpass >= this.MaximumSequenceLength ||
                    matchedSequencePosition + lengthToSurpass >= input.length)
                    break;
                if (input[testedSequencePosition + lengthToSurpass] !== input[matchedSequencePosition + lengthToSurpass])
                    continue;
                for (var offset = 0;; offset++) {
                    if (matchedSequencePosition + offset === input.length ||
                        input[testedSequencePosition + offset] !== input[matchedSequencePosition + offset]) {
                        if (offset > lengthToSurpass) {
                            longestMatchDistance = testedSequenceDistance;
                            longestMatchLength = offset;
                        }
                        break;
                    }
                    else if (offset === this.MaximumSequenceLength)
                        return { distance: testedSequenceDistance, length: this.MaximumSequenceLength };
                }
            }
            if (longestMatchDistance !== undefined)
                return { distance: longestMatchDistance, length: longestMatchLength };
            else
                return null;
        };
        Compressor.prototype.getBucketIndexForPrefix = function (startPosition) {
            return (this.inputBuffer[startPosition] * 7880599 +
                this.inputBuffer[startPosition + 1] * 39601 +
                this.inputBuffer[startPosition + 2] * 199 +
                this.inputBuffer[startPosition + 3]) % this.PrefixHashTableSize;
        };
        Compressor.prototype.outputPointerBytes = function (length, distance) {
            if (distance < 128) {
                this.outputRawByte(192 | length);
                this.outputRawByte(distance);
            }
            else {
                this.outputRawByte(224 | length);
                this.outputRawByte(distance >>> 8);
                this.outputRawByte(distance & 255);
            }
        };
        Compressor.prototype.outputRawByte = function (value) {
            this.outputBuffer[this.outputBufferPosition++] = value;
        };
        Compressor.prototype.cropAndAddNewBytesToInputBuffer = function (newInput) {
            if (this.inputBuffer === undefined) {
                this.inputBuffer = newInput;
                return 0;
            }
            else {
                var cropLength = Math.min(this.inputBuffer.length, this.MaximumMatchDistance);
                var cropStartOffset = this.inputBuffer.length - cropLength;
                this.inputBuffer = LZUTF8.CompressionCommon.getCroppedAndAppendedByteArray(this.inputBuffer, cropStartOffset, cropLength, newInput);
                this.inputBufferStreamOffset += cropStartOffset;
                return cropLength;
            }
        };
        return Compressor;
    }());
    LZUTF8.Compressor = Compressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorCustomHashTable = (function () {
        function CompressorCustomHashTable(bucketCount) {
            this.minimumBucketCapacity = 4;
            this.maximumBucketCapacity = 64;
            this.bucketLocators = new Uint32Array(bucketCount * 2);
            this.storage = new Uint32Array(bucketCount * 2);
            this.storageIndex = 1;
        }
        CompressorCustomHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            bucketIndex <<= 1;
            if (this.storageIndex >= (this.storage.length >>> 1))
                this.compact();
            var startPosition = this.bucketLocators[bucketIndex];
            var length;
            if (startPosition === 0) {
                startPosition = this.storageIndex;
                length = 1;
                this.storage[this.storageIndex] = valueToAdd;
                this.storageIndex += this.minimumBucketCapacity;
            }
            else {
                length = this.bucketLocators[bucketIndex + 1];
                if (length === this.maximumBucketCapacity - 1)
                    length = this.truncateBucketToNewerElements(startPosition, length, this.maximumBucketCapacity / 2);
                var endPosition = startPosition + length;
                if (this.storage[endPosition] === 0) {
                    this.storage[endPosition] = valueToAdd;
                    if (endPosition === this.storageIndex)
                        this.storageIndex += length;
                }
                else {
                    LZUTF8.ArrayTools.copyElements(this.storage, startPosition, this.storage, this.storageIndex, length);
                    startPosition = this.storageIndex;
                    this.storageIndex += length;
                    this.storage[this.storageIndex++] = valueToAdd;
                    this.storageIndex += length;
                }
                length++;
            }
            this.bucketLocators[bucketIndex] = startPosition;
            this.bucketLocators[bucketIndex + 1] = length;
        };
        CompressorCustomHashTable.prototype.truncateBucketToNewerElements = function (startPosition, bucketLength, truncatedBucketLength) {
            var sourcePosition = startPosition + bucketLength - truncatedBucketLength;
            LZUTF8.ArrayTools.copyElements(this.storage, sourcePosition, this.storage, startPosition, truncatedBucketLength);
            LZUTF8.ArrayTools.zeroElements(this.storage, startPosition + truncatedBucketLength, bucketLength - truncatedBucketLength);
            return truncatedBucketLength;
        };
        CompressorCustomHashTable.prototype.compact = function () {
            var oldBucketLocators = this.bucketLocators;
            var oldStorage = this.storage;
            this.bucketLocators = new Uint32Array(this.bucketLocators.length);
            this.storageIndex = 1;
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var length_3 = oldBucketLocators[bucketIndex + 1];
                if (length_3 === 0)
                    continue;
                this.bucketLocators[bucketIndex] = this.storageIndex;
                this.bucketLocators[bucketIndex + 1] = length_3;
                this.storageIndex += Math.max(Math.min(length_3 * 2, this.maximumBucketCapacity), this.minimumBucketCapacity);
            }
            this.storage = new Uint32Array(this.storageIndex * 8);
            for (var bucketIndex = 0; bucketIndex < oldBucketLocators.length; bucketIndex += 2) {
                var sourcePosition = oldBucketLocators[bucketIndex];
                if (sourcePosition === 0)
                    continue;
                var destPosition = this.bucketLocators[bucketIndex];
                var length_4 = this.bucketLocators[bucketIndex + 1];
                LZUTF8.ArrayTools.copyElements(oldStorage, sourcePosition, this.storage, destPosition, length_4);
            }
        };
        CompressorCustomHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            bucketIndex <<= 1;
            var startPosition = this.bucketLocators[bucketIndex];
            if (startPosition === 0)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment(this.storage, startPosition, this.bucketLocators[bucketIndex + 1]);
            return outputObject;
        };
        CompressorCustomHashTable.prototype.getUsedBucketCount = function () {
            return Math.floor(LZUTF8.ArrayTools.countNonzeroValuesInArray(this.bucketLocators) / 2);
        };
        CompressorCustomHashTable.prototype.getTotalElementCount = function () {
            var result = 0;
            for (var i = 0; i < this.bucketLocators.length; i += 2)
                result += this.bucketLocators[i + 1];
            return result;
        };
        return CompressorCustomHashTable;
    }());
    LZUTF8.CompressorCustomHashTable = CompressorCustomHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var CompressorSimpleHashTable = (function () {
        function CompressorSimpleHashTable(size) {
            this.maximumBucketCapacity = 64;
            this.buckets = new Array(size);
        }
        CompressorSimpleHashTable.prototype.addValueToBucket = function (bucketIndex, valueToAdd) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined) {
                this.buckets[bucketIndex] = [valueToAdd];
            }
            else {
                if (bucket.length === this.maximumBucketCapacity - 1)
                    LZUTF8.ArrayTools.truncateStartingElements(bucket, this.maximumBucketCapacity / 2);
                bucket.push(valueToAdd);
            }
        };
        CompressorSimpleHashTable.prototype.getArraySegmentForBucketIndex = function (bucketIndex, outputObject) {
            var bucket = this.buckets[bucketIndex];
            if (bucket === undefined)
                return null;
            if (outputObject === undefined)
                outputObject = new LZUTF8.ArraySegment(bucket, 0, bucket.length);
            return outputObject;
        };
        CompressorSimpleHashTable.prototype.getUsedBucketCount = function () {
            return LZUTF8.ArrayTools.countNonzeroValuesInArray(this.buckets);
        };
        CompressorSimpleHashTable.prototype.getTotalElementCount = function () {
            var currentSum = 0;
            for (var i = 0; i < this.buckets.length; i++) {
                if (this.buckets[i] !== undefined)
                    currentSum += this.buckets[i].length;
            }
            return currentSum;
        };
        return CompressorSimpleHashTable;
    }());
    LZUTF8.CompressorSimpleHashTable = CompressorSimpleHashTable;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Decompressor = (function () {
        function Decompressor() {
            this.MaximumMatchDistance = 32767;
            this.outputPosition = 0;
        }
        Decompressor.prototype.decompressBlockToString = function (input) {
            input = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
            return LZUTF8.decodeUTF8(this.decompressBlock(input));
        };
        Decompressor.prototype.decompressBlock = function (input) {
            if (this.inputBufferRemainder) {
                input = LZUTF8.ArrayTools.concatUint8Arrays([this.inputBufferRemainder, input]);
                this.inputBufferRemainder = undefined;
            }
            var outputStartPosition = this.cropOutputBufferToWindowAndInitialize(Math.max(input.length * 4, 1024));
            for (var readPosition = 0, inputLength = input.length; readPosition < inputLength; readPosition++) {
                var inputValue = input[readPosition];
                if (inputValue >>> 6 != 3) {
                    this.outputByte(inputValue);
                    continue;
                }
                var sequenceLengthIdentifier = inputValue >>> 5;
                if (readPosition == inputLength - 1 ||
                    (readPosition == inputLength - 2 && sequenceLengthIdentifier == 7)) {
                    this.inputBufferRemainder = input.subarray(readPosition);
                    break;
                }
                if (input[readPosition + 1] >>> 7 === 1) {
                    this.outputByte(inputValue);
                }
                else {
                    var matchLength = inputValue & 31;
                    var matchDistance = void 0;
                    if (sequenceLengthIdentifier == 6) {
                        matchDistance = input[readPosition + 1];
                        readPosition += 1;
                    }
                    else {
                        matchDistance = (input[readPosition + 1] << 8) | (input[readPosition + 2]);
                        readPosition += 2;
                    }
                    var matchPosition = this.outputPosition - matchDistance;
                    for (var offset = 0; offset < matchLength; offset++)
                        this.outputByte(this.outputBuffer[matchPosition + offset]);
                }
            }
            this.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence();
            return LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, outputStartPosition, this.outputPosition - outputStartPosition);
        };
        Decompressor.prototype.outputByte = function (value) {
            if (this.outputPosition === this.outputBuffer.length)
                this.outputBuffer = LZUTF8.ArrayTools.doubleByteArrayCapacity(this.outputBuffer);
            this.outputBuffer[this.outputPosition++] = value;
        };
        Decompressor.prototype.cropOutputBufferToWindowAndInitialize = function (initialCapacity) {
            if (!this.outputBuffer) {
                this.outputBuffer = new Uint8Array(initialCapacity);
                return 0;
            }
            var cropLength = Math.min(this.outputPosition, this.MaximumMatchDistance);
            this.outputBuffer = LZUTF8.CompressionCommon.getCroppedBuffer(this.outputBuffer, this.outputPosition - cropLength, cropLength, initialCapacity);
            this.outputPosition = cropLength;
            if (this.outputBufferRemainder) {
                for (var i = 0; i < this.outputBufferRemainder.length; i++)
                    this.outputByte(this.outputBufferRemainder[i]);
                this.outputBufferRemainder = undefined;
            }
            return cropLength;
        };
        Decompressor.prototype.rollBackIfOutputBufferEndsWithATruncatedMultibyteSequence = function () {
            for (var offset = 1; offset <= 4 && this.outputPosition - offset >= 0; offset++) {
                var value = this.outputBuffer[this.outputPosition - offset];
                if ((offset < 4 && (value >>> 3) === 30) ||
                    (offset < 3 && (value >>> 4) === 14) ||
                    (offset < 2 && (value >>> 5) === 6)) {
                    this.outputBufferRemainder = this.outputBuffer.subarray(this.outputPosition - offset, this.outputPosition);
                    this.outputPosition -= offset;
                    return;
                }
            }
        };
        return Decompressor;
    }());
    LZUTF8.Decompressor = Decompressor;
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var Base64;
        (function (Base64) {
            var charCodeMap = new Uint8Array([65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 43, 47]);
            var reverseCharCodeMap = new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 255, 255, 255, 255]);
            var paddingCharacter = "=";
            var paddingCharCode = 61;
            Base64.encode = function (inputBytes) {
                if (!inputBytes || inputBytes.length == 0)
                    return "";
                if (LZUTF8.runningInNodeJS()) {
                    return (LZUTF8.BufferTools.uint8ArrayToBuffer(inputBytes)).toString("base64");
                }
                else {
                    return Base64.encodeWithJS(inputBytes);
                }
            };
            Base64.decode = function (base64String) {
                if (!base64String)
                    return new Uint8Array(0);
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.bufferToUint8Array(Buffer.from(base64String, "base64"));
                }
                else {
                    return Base64.decodeWithJS(base64String);
                }
            };
            Base64.encodeWithJS = function (inputBytes, addPadding) {
                if (addPadding === void 0) { addPadding = true; }
                if (!inputBytes || inputBytes.length == 0)
                    return "";
                var map = charCodeMap;
                var output = new LZUTF8.StringBuilder();
                var uint24;
                for (var readPosition = 0, length_5 = inputBytes.length; readPosition < length_5; readPosition += 3) {
                    if (readPosition <= length_5 - 3) {
                        uint24 = inputBytes[readPosition] << 16 | inputBytes[readPosition + 1] << 8 | inputBytes[readPosition + 2];
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        output.appendCharCode(map[(uint24 >>> 6) & 63]);
                        output.appendCharCode(map[(uint24) & 63]);
                        uint24 = 0;
                    }
                    else if (readPosition === length_5 - 2) {
                        uint24 = inputBytes[readPosition] << 16 | inputBytes[readPosition + 1] << 8;
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        output.appendCharCode(map[(uint24 >>> 6) & 63]);
                        if (addPadding)
                            output.appendCharCode(paddingCharCode);
                    }
                    else if (readPosition === length_5 - 1) {
                        uint24 = inputBytes[readPosition] << 16;
                        output.appendCharCode(map[(uint24 >>> 18) & 63]);
                        output.appendCharCode(map[(uint24 >>> 12) & 63]);
                        if (addPadding) {
                            output.appendCharCode(paddingCharCode);
                            output.appendCharCode(paddingCharCode);
                        }
                    }
                }
                return output.getOutputString();
            };
            Base64.decodeWithJS = function (base64String, outputBuffer) {
                if (!base64String || base64String.length == 0)
                    return new Uint8Array(0);
                var lengthModulo4 = base64String.length % 4;
                if (lengthModulo4 === 1)
                    throw new Error("Invalid Base64 string: length % 4 == 1");
                else if (lengthModulo4 === 2)
                    base64String += paddingCharacter + paddingCharacter;
                else if (lengthModulo4 === 3)
                    base64String += paddingCharacter;
                if (!outputBuffer)
                    outputBuffer = new Uint8Array(base64String.length);
                var outputPosition = 0;
                var length = base64String.length;
                for (var i = 0; i < length; i += 4) {
                    var uint24 = (reverseCharCodeMap[base64String.charCodeAt(i)] << 18) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 1)] << 12) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 2)] << 6) |
                        (reverseCharCodeMap[base64String.charCodeAt(i + 3)]);
                    outputBuffer[outputPosition++] = (uint24 >>> 16) & 255;
                    outputBuffer[outputPosition++] = (uint24 >>> 8) & 255;
                    outputBuffer[outputPosition++] = (uint24) & 255;
                }
                if (base64String.charCodeAt(length - 1) == paddingCharCode)
                    outputPosition--;
                if (base64String.charCodeAt(length - 2) == paddingCharCode)
                    outputPosition--;
                return outputBuffer.subarray(0, outputPosition);
            };
        })(Base64 = Encoding.Base64 || (Encoding.Base64 = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var BinaryString;
        (function (BinaryString) {
            BinaryString.encode = function (input) {
                if (input == null)
                    throw new TypeError("BinaryString.encode: undefined or null input received");
                if (input.length === 0)
                    return "";
                var inputLength = input.length;
                var outputStringBuilder = new LZUTF8.StringBuilder();
                var remainder = 0;
                var state = 1;
                for (var i = 0; i < inputLength; i += 2) {
                    var value = void 0;
                    if (i == inputLength - 1)
                        value = (input[i] << 8);
                    else
                        value = (input[i] << 8) | input[i + 1];
                    outputStringBuilder.appendCharCode((remainder << (16 - state)) | value >>> state);
                    remainder = value & ((1 << state) - 1);
                    if (state === 15) {
                        outputStringBuilder.appendCharCode(remainder);
                        remainder = 0;
                        state = 1;
                    }
                    else {
                        state += 1;
                    }
                    if (i >= inputLength - 2)
                        outputStringBuilder.appendCharCode(remainder << (16 - state));
                }
                outputStringBuilder.appendCharCode(32768 | (inputLength % 2));
                return outputStringBuilder.getOutputString();
            };
            BinaryString.decode = function (input) {
                if (typeof input !== "string")
                    throw new TypeError("BinaryString.decode: invalid input type");
                if (input == "")
                    return new Uint8Array(0);
                var output = new Uint8Array(input.length * 3);
                var outputPosition = 0;
                var appendToOutput = function (value) {
                    output[outputPosition++] = value >>> 8;
                    output[outputPosition++] = value & 255;
                };
                var remainder = 0;
                var state = 0;
                for (var i = 0; i < input.length; i++) {
                    var value = input.charCodeAt(i);
                    if (value >= 32768) {
                        if (value == (32768 | 1))
                            outputPosition--;
                        state = 0;
                        continue;
                    }
                    if (state == 0) {
                        remainder = value;
                    }
                    else {
                        appendToOutput((remainder << state) | (value >>> (15 - state)));
                        remainder = value & ((1 << (15 - state)) - 1);
                    }
                    if (state == 15)
                        state = 0;
                    else
                        state += 1;
                }
                return output.subarray(0, outputPosition);
            };
        })(BinaryString = Encoding.BinaryString || (Encoding.BinaryString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var CodePoint;
        (function (CodePoint) {
            CodePoint.encodeFromString = function (str, position) {
                var charCode = str.charCodeAt(position);
                if (charCode < 0xD800 || charCode > 0xDBFF)
                    return charCode;
                else {
                    var nextCharCode = str.charCodeAt(position + 1);
                    if (nextCharCode >= 0xDC00 && nextCharCode <= 0xDFFF)
                        return 0x10000 + (((charCode - 0xD800) << 10) + (nextCharCode - 0xDC00));
                    else
                        throw new Error("getUnicodeCodePoint: Received a lead surrogate character, char code ".concat(charCode, ", followed by ").concat(nextCharCode, ", which is not a trailing surrogate character code."));
                }
            };
            CodePoint.decodeToString = function (codePoint) {
                if (codePoint <= 0xFFFF)
                    return String.fromCharCode(codePoint);
                else if (codePoint <= 0x10FFFF)
                    return String.fromCharCode(0xD800 + ((codePoint - 0x10000) >>> 10), 0xDC00 + ((codePoint - 0x10000) & 1023));
                else
                    throw new Error("getStringFromUnicodeCodePoint: A code point of ".concat(codePoint, " cannot be encoded in UTF-16"));
            };
        })(CodePoint = Encoding.CodePoint || (Encoding.CodePoint = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var DecimalString;
        (function (DecimalString) {
            var lookupTable = ["000", "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015", "016", "017", "018", "019", "020", "021", "022", "023", "024", "025", "026", "027", "028", "029", "030", "031", "032", "033", "034", "035", "036", "037", "038", "039", "040", "041", "042", "043", "044", "045", "046", "047", "048", "049", "050", "051", "052", "053", "054", "055", "056", "057", "058", "059", "060", "061", "062", "063", "064", "065", "066", "067", "068", "069", "070", "071", "072", "073", "074", "075", "076", "077", "078", "079", "080", "081", "082", "083", "084", "085", "086", "087", "088", "089", "090", "091", "092", "093", "094", "095", "096", "097", "098", "099", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118", "119", "120", "121", "122", "123", "124", "125", "126", "127", "128", "129", "130", "131", "132", "133", "134", "135", "136", "137", "138", "139", "140", "141", "142", "143", "144", "145", "146", "147", "148", "149", "150", "151", "152", "153", "154", "155", "156", "157", "158", "159", "160", "161", "162", "163", "164", "165", "166", "167", "168", "169", "170", "171", "172", "173", "174", "175", "176", "177", "178", "179", "180", "181", "182", "183", "184", "185", "186", "187", "188", "189", "190", "191", "192", "193", "194", "195", "196", "197", "198", "199", "200", "201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211", "212", "213", "214", "215", "216", "217", "218", "219", "220", "221", "222", "223", "224", "225", "226", "227", "228", "229", "230", "231", "232", "233", "234", "235", "236", "237", "238", "239", "240", "241", "242", "243", "244", "245", "246", "247", "248", "249", "250", "251", "252", "253", "254", "255"];
            DecimalString.encode = function (binaryBytes) {
                var resultArray = [];
                for (var i = 0; i < binaryBytes.length; i++)
                    resultArray.push(lookupTable[binaryBytes[i]]);
                return resultArray.join(" ");
            };
        })(DecimalString = Encoding.DecimalString || (Encoding.DecimalString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var StorageBinaryString;
        (function (StorageBinaryString) {
            StorageBinaryString.encode = function (input) {
                return Encoding.BinaryString.encode(input).replace(/\0/g, '\u8002');
            };
            StorageBinaryString.decode = function (input) {
                return Encoding.BinaryString.decode(input.replace(/\u8002/g, '\0'));
            };
        })(StorageBinaryString = Encoding.StorageBinaryString || (Encoding.StorageBinaryString = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    var Encoding;
    (function (Encoding) {
        var UTF8;
        (function (UTF8) {
            var nativeTextEncoder;
            var nativeTextDecoder;
            UTF8.encode = function (str) {
                if (!str || str.length == 0)
                    return new Uint8Array(0);
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.bufferToUint8Array(Buffer.from(str, "utf8"));
                }
                else if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
                    return nativeTextEncoder.encode(str);
                }
                else {
                    return UTF8.encodeWithJS(str);
                }
            };
            UTF8.decode = function (utf8Bytes) {
                if (!utf8Bytes || utf8Bytes.length == 0)
                    return "";
                if (LZUTF8.runningInNodeJS()) {
                    return LZUTF8.BufferTools.uint8ArrayToBuffer(utf8Bytes).toString("utf8");
                }
                else if (UTF8.createNativeTextEncoderAndDecoderIfAvailable()) {
                    return nativeTextDecoder.decode(utf8Bytes);
                }
                else {
                    return UTF8.decodeWithJS(utf8Bytes);
                }
            };
            UTF8.encodeWithJS = function (str, outputArray) {
                if (!str || str.length == 0)
                    return new Uint8Array(0);
                if (!outputArray)
                    outputArray = new Uint8Array(str.length * 4);
                var writeIndex = 0;
                for (var readIndex = 0; readIndex < str.length; readIndex++) {
                    var charCode = Encoding.CodePoint.encodeFromString(str, readIndex);
                    if (charCode <= 0x7F) {
                        outputArray[writeIndex++] = charCode;
                    }
                    else if (charCode <= 0x7FF) {
                        outputArray[writeIndex++] = 0xC0 | (charCode >>> 6);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                    }
                    else if (charCode <= 0xFFFF) {
                        outputArray[writeIndex++] = 0xE0 | (charCode >>> 12);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                    }
                    else if (charCode <= 0x10FFFF) {
                        outputArray[writeIndex++] = 0xF0 | (charCode >>> 18);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 12) & 63);
                        outputArray[writeIndex++] = 0x80 | ((charCode >>> 6) & 63);
                        outputArray[writeIndex++] = 0x80 | (charCode & 63);
                        readIndex++;
                    }
                    else
                        throw new Error("Invalid UTF-16 string: Encountered a character unsupported by UTF-8/16 (RFC 3629)");
                }
                return outputArray.subarray(0, writeIndex);
            };
            UTF8.decodeWithJS = function (utf8Bytes, startOffset, endOffset) {
                if (startOffset === void 0) { startOffset = 0; }
                if (!utf8Bytes || utf8Bytes.length == 0)
                    return "";
                if (endOffset === undefined)
                    endOffset = utf8Bytes.length;
                var output = new LZUTF8.StringBuilder();
                var outputCodePoint;
                var leadByte;
                for (var readIndex = startOffset, length_6 = endOffset; readIndex < length_6;) {
                    leadByte = utf8Bytes[readIndex];
                    if ((leadByte >>> 7) === 0) {
                        outputCodePoint = leadByte;
                        readIndex += 1;
                    }
                    else if ((leadByte >>> 5) === 6) {
                        if (readIndex + 1 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 31) << 6) | (utf8Bytes[readIndex + 1] & 63);
                        readIndex += 2;
                    }
                    else if ((leadByte >>> 4) === 14) {
                        if (readIndex + 2 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 15) << 12) | ((utf8Bytes[readIndex + 1] & 63) << 6) | (utf8Bytes[readIndex + 2] & 63);
                        readIndex += 3;
                    }
                    else if ((leadByte >>> 3) === 30) {
                        if (readIndex + 3 >= endOffset)
                            throw new Error("Invalid UTF-8 stream: Truncated codepoint sequence encountered at position " + readIndex);
                        outputCodePoint = ((leadByte & 7) << 18) | ((utf8Bytes[readIndex + 1] & 63) << 12) | ((utf8Bytes[readIndex + 2] & 63) << 6) | (utf8Bytes[readIndex + 3] & 63);
                        readIndex += 4;
                    }
                    else
                        throw new Error("Invalid UTF-8 stream: An invalid lead byte value encountered at position " + readIndex);
                    output.appendCodePoint(outputCodePoint);
                }
                return output.getOutputString();
            };
            UTF8.createNativeTextEncoderAndDecoderIfAvailable = function () {
                if (nativeTextEncoder)
                    return true;
                if (typeof TextEncoder == "function") {
                    nativeTextEncoder = new TextEncoder("utf-8");
                    nativeTextDecoder = new TextDecoder("utf-8");
                    return true;
                }
                else
                    return false;
            };
        })(UTF8 = Encoding.UTF8 || (Encoding.UTF8 = {}));
    })(Encoding = LZUTF8.Encoding || (LZUTF8.Encoding = {}));
})(LZUTF8 || (LZUTF8 = {}));
var LZUTF8;
(function (LZUTF8) {
    function compress(input, options) {
        if (options === void 0) { options = {}; }
        if (input == null)
            throw new TypeError("compress: undefined or null input received");
        var inputEncoding = LZUTF8.CompressionCommon.detectCompressionSourceEncoding(input);
        options = LZUTF8.ObjectTools.override({ inputEncoding: inputEncoding, outputEncoding: "ByteArray" }, options);
        var compressor = new LZUTF8.Compressor();
        var compressedBytes = compressor.compressBlock(input);
        return LZUTF8.CompressionCommon.encodeCompressedBytes(compressedBytes, options.outputEncoding);
    }
    LZUTF8.compress = compress;
    function decompress(input, options) {
        if (options === void 0) { options = {}; }
        if (input == null)
            throw new TypeError("decompress: undefined or null input received");
        options = LZUTF8.ObjectTools.override({ inputEncoding: "ByteArray", outputEncoding: "String" }, options);
        var inputBytes = LZUTF8.CompressionCommon.decodeCompressedBytes(input, options.inputEncoding);
        var decompressor = new LZUTF8.Decompressor();
        var decompressedBytes = decompressor.decompressBlock(inputBytes);
        return LZUTF8.CompressionCommon.encodeDecompressedBytes(decompressedBytes, options.outputEncoding);
    }
    LZUTF8.decompress = decompress;
    function compressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        var inputEncoding;
        try {
            inputEncoding = LZUTF8.CompressionCommon.detectCompressionSourceEncoding(input);
        }
        catch (e) {
            callback(undefined, e);
            return;
        }
        options = LZUTF8.ObjectTools.override({
            inputEncoding: inputEncoding,
            outputEncoding: "ByteArray",
            useWebWorker: true,
            blockSize: 65536
        }, options);
        LZUTF8.enqueueImmediate(function () {
            if (options.useWebWorker && LZUTF8.WebWorker.createGlobalWorkerIfNeeded()) {
                LZUTF8.WebWorker.compressAsync(input, options, callback);
            }
            else {
                LZUTF8.AsyncCompressor.compressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.compressAsync = compressAsync;
    function decompressAsync(input, options, callback) {
        if (callback == null)
            callback = function () { };
        if (input == null) {
            callback(undefined, new TypeError("decompressAsync: undefined or null input received"));
            return;
        }
        options = LZUTF8.ObjectTools.override({
            inputEncoding: "ByteArray",
            outputEncoding: "String",
            useWebWorker: true,
            blockSize: 65536
        }, options);
        var normalizedInput = LZUTF8.BufferTools.convertToUint8ArrayIfNeeded(input);
        LZUTF8.EventLoop.enqueueImmediate(function () {
            if (options.useWebWorker && LZUTF8.WebWorker.createGlobalWorkerIfNeeded()) {
                LZUTF8.WebWorker.decompressAsync(normalizedInput, options, callback);
            }
            else {
                LZUTF8.AsyncDecompressor.decompressAsync(input, options, callback);
            }
        });
    }
    LZUTF8.decompressAsync = decompressAsync;
    function createCompressionStream() {
        return LZUTF8.AsyncCompressor.createCompressionStream();
    }
    LZUTF8.createCompressionStream = createCompressionStream;
    function createDecompressionStream() {
        return LZUTF8.AsyncDecompressor.createDecompressionStream();
    }
    LZUTF8.createDecompressionStream = createDecompressionStream;
    function encodeUTF8(str) {
        return LZUTF8.Encoding.UTF8.encode(str);
    }
    LZUTF8.encodeUTF8 = encodeUTF8;
    function decodeUTF8(input) {
        return LZUTF8.Encoding.UTF8.decode(input);
    }
    LZUTF8.decodeUTF8 = decodeUTF8;
    function encodeBase64(input) {
        return LZUTF8.Encoding.Base64.encode(input);
    }
    LZUTF8.encodeBase64 = encodeBase64;
    function decodeBase64(str) {
        return LZUTF8.Encoding.Base64.decode(str);
    }
    LZUTF8.decodeBase64 = decodeBase64;
    function encodeBinaryString(input) {
        return LZUTF8.Encoding.BinaryString.encode(input);
    }
    LZUTF8.encodeBinaryString = encodeBinaryString;
    function decodeBinaryString(str) {
        return LZUTF8.Encoding.BinaryString.decode(str);
    }
    LZUTF8.decodeBinaryString = decodeBinaryString;
    function encodeStorageBinaryString(input) {
        return LZUTF8.Encoding.StorageBinaryString.encode(input);
    }
    LZUTF8.encodeStorageBinaryString = encodeStorageBinaryString;
    function decodeStorageBinaryString(str) {
        return LZUTF8.Encoding.StorageBinaryString.decode(str);
    }
    LZUTF8.decodeStorageBinaryString = decodeStorageBinaryString;
})(LZUTF8 || (LZUTF8 = {}));

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer,arguments[3],arguments[4],arguments[5],arguments[6],require("timers").setImmediate)
},{"_process":31,"buffer":3,"readable-stream":25,"timers":34}],7:[function(require,module,exports){
'use strict'

const { SymbolDispose } = require('../../ours/primordials')
const { AbortError, codes } = require('../../ours/errors')
const { isNodeStream, isWebStream, kControllerErrorFunction } = require('./utils')
const eos = require('./end-of-stream')
const { ERR_INVALID_ARG_TYPE } = codes
let addAbortListener

// This method is inlined here for readable-stream
// It also does not allow for signal to not exist on the stream
// https://github.com/nodejs/node/pull/36061#discussion_r533718029
const validateAbortSignal = (signal, name) => {
  if (typeof signal !== 'object' || !('aborted' in signal)) {
    throw new ERR_INVALID_ARG_TYPE(name, 'AbortSignal', signal)
  }
}
module.exports.addAbortSignal = function addAbortSignal(signal, stream) {
  validateAbortSignal(signal, 'signal')
  if (!isNodeStream(stream) && !isWebStream(stream)) {
    throw new ERR_INVALID_ARG_TYPE('stream', ['ReadableStream', 'WritableStream', 'Stream'], stream)
  }
  return module.exports.addAbortSignalNoValidate(signal, stream)
}
module.exports.addAbortSignalNoValidate = function (signal, stream) {
  if (typeof signal !== 'object' || !('aborted' in signal)) {
    return stream
  }
  const onAbort = isNodeStream(stream)
    ? () => {
        stream.destroy(
          new AbortError(undefined, {
            cause: signal.reason
          })
        )
      }
    : () => {
        stream[kControllerErrorFunction](
          new AbortError(undefined, {
            cause: signal.reason
          })
        )
      }
  if (signal.aborted) {
    onAbort()
  } else {
    addAbortListener = addAbortListener || require('../../ours/util').addAbortListener
    const disposable = addAbortListener(signal, onAbort)
    eos(stream, disposable[SymbolDispose])
  }
  return stream
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"./end-of-stream":13,"./utils":22}],8:[function(require,module,exports){
'use strict'

const { StringPrototypeSlice, SymbolIterator, TypedArrayPrototypeSet, Uint8Array } = require('../../ours/primordials')
const { Buffer } = require('buffer')
const { inspect } = require('../../ours/util')
module.exports = class BufferList {
  constructor() {
    this.head = null
    this.tail = null
    this.length = 0
  }
  push(v) {
    const entry = {
      data: v,
      next: null
    }
    if (this.length > 0) this.tail.next = entry
    else this.head = entry
    this.tail = entry
    ++this.length
  }
  unshift(v) {
    const entry = {
      data: v,
      next: this.head
    }
    if (this.length === 0) this.tail = entry
    this.head = entry
    ++this.length
  }
  shift() {
    if (this.length === 0) return
    const ret = this.head.data
    if (this.length === 1) this.head = this.tail = null
    else this.head = this.head.next
    --this.length
    return ret
  }
  clear() {
    this.head = this.tail = null
    this.length = 0
  }
  join(s) {
    if (this.length === 0) return ''
    let p = this.head
    let ret = '' + p.data
    while ((p = p.next) !== null) ret += s + p.data
    return ret
  }
  concat(n) {
    if (this.length === 0) return Buffer.alloc(0)
    const ret = Buffer.allocUnsafe(n >>> 0)
    let p = this.head
    let i = 0
    while (p) {
      TypedArrayPrototypeSet(ret, p.data, i)
      i += p.data.length
      p = p.next
    }
    return ret
  }

  // Consumes a specified amount of bytes or characters from the buffered data.
  consume(n, hasStrings) {
    const data = this.head.data
    if (n < data.length) {
      // `slice` is the same for buffers and strings.
      const slice = data.slice(0, n)
      this.head.data = data.slice(n)
      return slice
    }
    if (n === data.length) {
      // First chunk is a perfect match.
      return this.shift()
    }
    // Result spans more than one buffer.
    return hasStrings ? this._getString(n) : this._getBuffer(n)
  }
  first() {
    return this.head.data
  }
  *[SymbolIterator]() {
    for (let p = this.head; p; p = p.next) {
      yield p.data
    }
  }

  // Consumes a specified amount of characters from the buffered data.
  _getString(n) {
    let ret = ''
    let p = this.head
    let c = 0
    do {
      const str = p.data
      if (n > str.length) {
        ret += str
        n -= str.length
      } else {
        if (n === str.length) {
          ret += str
          ++c
          if (p.next) this.head = p.next
          else this.head = this.tail = null
        } else {
          ret += StringPrototypeSlice(str, 0, n)
          this.head = p
          p.data = StringPrototypeSlice(str, n)
        }
        break
      }
      ++c
    } while ((p = p.next) !== null)
    this.length -= c
    return ret
  }

  // Consumes a specified amount of bytes from the buffered data.
  _getBuffer(n) {
    const ret = Buffer.allocUnsafe(n)
    const retLen = n
    let p = this.head
    let c = 0
    do {
      const buf = p.data
      if (n > buf.length) {
        TypedArrayPrototypeSet(ret, buf, retLen - n)
        n -= buf.length
      } else {
        if (n === buf.length) {
          TypedArrayPrototypeSet(ret, buf, retLen - n)
          ++c
          if (p.next) this.head = p.next
          else this.head = this.tail = null
        } else {
          TypedArrayPrototypeSet(ret, new Uint8Array(buf.buffer, buf.byteOffset, n), retLen - n)
          this.head = p
          p.data = buf.slice(n)
        }
        break
      }
      ++c
    } while ((p = p.next) !== null)
    this.length -= c
    return ret
  }

  // Make sure the linked list only shows the minimal necessary information.
  [Symbol.for('nodejs.util.inspect.custom')](_, options) {
    return inspect(this, {
      ...options,
      // Only inspect one level.
      depth: 0,
      // It should not recurse.
      customInspect: false
    })
  }
}

},{"../../ours/primordials":27,"../../ours/util":28,"buffer":3}],9:[function(require,module,exports){
'use strict'

const { pipeline } = require('./pipeline')
const Duplex = require('./duplex')
const { destroyer } = require('./destroy')
const {
  isNodeStream,
  isReadable,
  isWritable,
  isWebStream,
  isTransformStream,
  isWritableStream,
  isReadableStream
} = require('./utils')
const {
  AbortError,
  codes: { ERR_INVALID_ARG_VALUE, ERR_MISSING_ARGS }
} = require('../../ours/errors')
const eos = require('./end-of-stream')
module.exports = function compose(...streams) {
  if (streams.length === 0) {
    throw new ERR_MISSING_ARGS('streams')
  }
  if (streams.length === 1) {
    return Duplex.from(streams[0])
  }
  const orgStreams = [...streams]
  if (typeof streams[0] === 'function') {
    streams[0] = Duplex.from(streams[0])
  }
  if (typeof streams[streams.length - 1] === 'function') {
    const idx = streams.length - 1
    streams[idx] = Duplex.from(streams[idx])
  }
  for (let n = 0; n < streams.length; ++n) {
    if (!isNodeStream(streams[n]) && !isWebStream(streams[n])) {
      // TODO(ronag): Add checks for non streams.
      continue
    }
    if (
      n < streams.length - 1 &&
      !(isReadable(streams[n]) || isReadableStream(streams[n]) || isTransformStream(streams[n]))
    ) {
      throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], 'must be readable')
    }
    if (n > 0 && !(isWritable(streams[n]) || isWritableStream(streams[n]) || isTransformStream(streams[n]))) {
      throw new ERR_INVALID_ARG_VALUE(`streams[${n}]`, orgStreams[n], 'must be writable')
    }
  }
  let ondrain
  let onfinish
  let onreadable
  let onclose
  let d
  function onfinished(err) {
    const cb = onclose
    onclose = null
    if (cb) {
      cb(err)
    } else if (err) {
      d.destroy(err)
    } else if (!readable && !writable) {
      d.destroy()
    }
  }
  const head = streams[0]
  const tail = pipeline(streams, onfinished)
  const writable = !!(isWritable(head) || isWritableStream(head) || isTransformStream(head))
  const readable = !!(isReadable(tail) || isReadableStream(tail) || isTransformStream(tail))

  // TODO(ronag): Avoid double buffering.
  // Implement Writable/Readable/Duplex traits.
  // See, https://github.com/nodejs/node/pull/33515.
  d = new Duplex({
    // TODO (ronag): highWaterMark?
    writableObjectMode: !!(head !== null && head !== undefined && head.writableObjectMode),
    readableObjectMode: !!(tail !== null && tail !== undefined && tail.readableObjectMode),
    writable,
    readable
  })
  if (writable) {
    if (isNodeStream(head)) {
      d._write = function (chunk, encoding, callback) {
        if (head.write(chunk, encoding)) {
          callback()
        } else {
          ondrain = callback
        }
      }
      d._final = function (callback) {
        head.end()
        onfinish = callback
      }
      head.on('drain', function () {
        if (ondrain) {
          const cb = ondrain
          ondrain = null
          cb()
        }
      })
    } else if (isWebStream(head)) {
      const writable = isTransformStream(head) ? head.writable : head
      const writer = writable.getWriter()
      d._write = async function (chunk, encoding, callback) {
        try {
          await writer.ready
          writer.write(chunk).catch(() => {})
          callback()
        } catch (err) {
          callback(err)
        }
      }
      d._final = async function (callback) {
        try {
          await writer.ready
          writer.close().catch(() => {})
          onfinish = callback
        } catch (err) {
          callback(err)
        }
      }
    }
    const toRead = isTransformStream(tail) ? tail.readable : tail
    eos(toRead, () => {
      if (onfinish) {
        const cb = onfinish
        onfinish = null
        cb()
      }
    })
  }
  if (readable) {
    if (isNodeStream(tail)) {
      tail.on('readable', function () {
        if (onreadable) {
          const cb = onreadable
          onreadable = null
          cb()
        }
      })
      tail.on('end', function () {
        d.push(null)
      })
      d._read = function () {
        while (true) {
          const buf = tail.read()
          if (buf === null) {
            onreadable = d._read
            return
          }
          if (!d.push(buf)) {
            return
          }
        }
      }
    } else if (isWebStream(tail)) {
      const readable = isTransformStream(tail) ? tail.readable : tail
      const reader = readable.getReader()
      d._read = async function () {
        while (true) {
          try {
            const { value, done } = await reader.read()
            if (!d.push(value)) {
              return
            }
            if (done) {
              d.push(null)
              return
            }
          } catch {
            return
          }
        }
      }
    }
  }
  d._destroy = function (err, callback) {
    if (!err && onclose !== null) {
      err = new AbortError()
    }
    onreadable = null
    ondrain = null
    onfinish = null
    if (onclose === null) {
      callback(err)
    } else {
      onclose = callback
      if (isNodeStream(tail)) {
        destroyer(tail, err)
      }
    }
  }
  return d
}

},{"../../ours/errors":26,"./destroy":10,"./duplex":11,"./end-of-stream":13,"./pipeline":18,"./utils":22}],10:[function(require,module,exports){
'use strict'

/* replacement start */

const process = require('process/')

/* replacement end */

const {
  aggregateTwoErrors,
  codes: { ERR_MULTIPLE_CALLBACK },
  AbortError
} = require('../../ours/errors')
const { Symbol } = require('../../ours/primordials')
const { kIsDestroyed, isDestroyed, isFinished, isServerRequest } = require('./utils')
const kDestroy = Symbol('kDestroy')
const kConstruct = Symbol('kConstruct')
function checkError(err, w, r) {
  if (err) {
    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
    err.stack // eslint-disable-line no-unused-expressions

    if (w && !w.errored) {
      w.errored = err
    }
    if (r && !r.errored) {
      r.errored = err
    }
  }
}

// Backwards compat. cb() is undocumented and unused in core but
// unfortunately might be used by modules.
function destroy(err, cb) {
  const r = this._readableState
  const w = this._writableState
  // With duplex streams we use the writable side for state.
  const s = w || r
  if ((w !== null && w !== undefined && w.destroyed) || (r !== null && r !== undefined && r.destroyed)) {
    if (typeof cb === 'function') {
      cb()
    }
    return this
  }

  // We set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks
  checkError(err, w, r)
  if (w) {
    w.destroyed = true
  }
  if (r) {
    r.destroyed = true
  }

  // If still constructing then defer calling _destroy.
  if (!s.constructed) {
    this.once(kDestroy, function (er) {
      _destroy(this, aggregateTwoErrors(er, err), cb)
    })
  } else {
    _destroy(this, err, cb)
  }
  return this
}
function _destroy(self, err, cb) {
  let called = false
  function onDestroy(err) {
    if (called) {
      return
    }
    called = true
    const r = self._readableState
    const w = self._writableState
    checkError(err, w, r)
    if (w) {
      w.closed = true
    }
    if (r) {
      r.closed = true
    }
    if (typeof cb === 'function') {
      cb(err)
    }
    if (err) {
      process.nextTick(emitErrorCloseNT, self, err)
    } else {
      process.nextTick(emitCloseNT, self)
    }
  }
  try {
    self._destroy(err || null, onDestroy)
  } catch (err) {
    onDestroy(err)
  }
}
function emitErrorCloseNT(self, err) {
  emitErrorNT(self, err)
  emitCloseNT(self)
}
function emitCloseNT(self) {
  const r = self._readableState
  const w = self._writableState
  if (w) {
    w.closeEmitted = true
  }
  if (r) {
    r.closeEmitted = true
  }
  if ((w !== null && w !== undefined && w.emitClose) || (r !== null && r !== undefined && r.emitClose)) {
    self.emit('close')
  }
}
function emitErrorNT(self, err) {
  const r = self._readableState
  const w = self._writableState
  if ((w !== null && w !== undefined && w.errorEmitted) || (r !== null && r !== undefined && r.errorEmitted)) {
    return
  }
  if (w) {
    w.errorEmitted = true
  }
  if (r) {
    r.errorEmitted = true
  }
  self.emit('error', err)
}
function undestroy() {
  const r = this._readableState
  const w = this._writableState
  if (r) {
    r.constructed = true
    r.closed = false
    r.closeEmitted = false
    r.destroyed = false
    r.errored = null
    r.errorEmitted = false
    r.reading = false
    r.ended = r.readable === false
    r.endEmitted = r.readable === false
  }
  if (w) {
    w.constructed = true
    w.destroyed = false
    w.closed = false
    w.closeEmitted = false
    w.errored = null
    w.errorEmitted = false
    w.finalCalled = false
    w.prefinished = false
    w.ended = w.writable === false
    w.ending = w.writable === false
    w.finished = w.writable === false
  }
}
function errorOrDestroy(stream, err, sync) {
  // We have tests that rely on errors being emitted
  // in the same tick, so changing this is semver major.
  // For now when you opt-in to autoDestroy we allow
  // the error to be emitted nextTick. In a future
  // semver major update we should change the default to this.

  const r = stream._readableState
  const w = stream._writableState
  if ((w !== null && w !== undefined && w.destroyed) || (r !== null && r !== undefined && r.destroyed)) {
    return this
  }
  if ((r !== null && r !== undefined && r.autoDestroy) || (w !== null && w !== undefined && w.autoDestroy))
    stream.destroy(err)
  else if (err) {
    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
    err.stack // eslint-disable-line no-unused-expressions

    if (w && !w.errored) {
      w.errored = err
    }
    if (r && !r.errored) {
      r.errored = err
    }
    if (sync) {
      process.nextTick(emitErrorNT, stream, err)
    } else {
      emitErrorNT(stream, err)
    }
  }
}
function construct(stream, cb) {
  if (typeof stream._construct !== 'function') {
    return
  }
  const r = stream._readableState
  const w = stream._writableState
  if (r) {
    r.constructed = false
  }
  if (w) {
    w.constructed = false
  }
  stream.once(kConstruct, cb)
  if (stream.listenerCount(kConstruct) > 1) {
    // Duplex
    return
  }
  process.nextTick(constructNT, stream)
}
function constructNT(stream) {
  let called = false
  function onConstruct(err) {
    if (called) {
      errorOrDestroy(stream, err !== null && err !== undefined ? err : new ERR_MULTIPLE_CALLBACK())
      return
    }
    called = true
    const r = stream._readableState
    const w = stream._writableState
    const s = w || r
    if (r) {
      r.constructed = true
    }
    if (w) {
      w.constructed = true
    }
    if (s.destroyed) {
      stream.emit(kDestroy, err)
    } else if (err) {
      errorOrDestroy(stream, err, true)
    } else {
      process.nextTick(emitConstructNT, stream)
    }
  }
  try {
    stream._construct((err) => {
      process.nextTick(onConstruct, err)
    })
  } catch (err) {
    process.nextTick(onConstruct, err)
  }
}
function emitConstructNT(stream) {
  stream.emit(kConstruct)
}
function isRequest(stream) {
  return (stream === null || stream === undefined ? undefined : stream.setHeader) && typeof stream.abort === 'function'
}
function emitCloseLegacy(stream) {
  stream.emit('close')
}
function emitErrorCloseLegacy(stream, err) {
  stream.emit('error', err)
  process.nextTick(emitCloseLegacy, stream)
}

// Normalize destroy for legacy.
function destroyer(stream, err) {
  if (!stream || isDestroyed(stream)) {
    return
  }
  if (!err && !isFinished(stream)) {
    err = new AbortError()
  }

  // TODO: Remove isRequest branches.
  if (isServerRequest(stream)) {
    stream.socket = null
    stream.destroy(err)
  } else if (isRequest(stream)) {
    stream.abort()
  } else if (isRequest(stream.req)) {
    stream.req.abort()
  } else if (typeof stream.destroy === 'function') {
    stream.destroy(err)
  } else if (typeof stream.close === 'function') {
    // TODO: Don't lose err?
    stream.close()
  } else if (err) {
    process.nextTick(emitErrorCloseLegacy, stream, err)
  } else {
    process.nextTick(emitCloseLegacy, stream)
  }
  if (!stream.destroyed) {
    stream[kIsDestroyed] = true
  }
}
module.exports = {
  construct,
  destroyer,
  destroy,
  undestroy,
  errorOrDestroy
}

},{"../../ours/errors":26,"../../ours/primordials":27,"./utils":22,"process/":31}],11:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototype inheritance, this class
// prototypically inherits from Readable, and then parasitically from
// Writable.

'use strict'

const {
  ObjectDefineProperties,
  ObjectGetOwnPropertyDescriptor,
  ObjectKeys,
  ObjectSetPrototypeOf
} = require('../../ours/primordials')
module.exports = Duplex
const Readable = require('./readable')
const Writable = require('./writable')
ObjectSetPrototypeOf(Duplex.prototype, Readable.prototype)
ObjectSetPrototypeOf(Duplex, Readable)
{
  const keys = ObjectKeys(Writable.prototype)
  // Allow the keys array to be GC'ed.
  for (let i = 0; i < keys.length; i++) {
    const method = keys[i]
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method]
  }
}
function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options)
  Readable.call(this, options)
  Writable.call(this, options)
  if (options) {
    this.allowHalfOpen = options.allowHalfOpen !== false
    if (options.readable === false) {
      this._readableState.readable = false
      this._readableState.ended = true
      this._readableState.endEmitted = true
    }
    if (options.writable === false) {
      this._writableState.writable = false
      this._writableState.ending = true
      this._writableState.ended = true
      this._writableState.finished = true
    }
  } else {
    this.allowHalfOpen = true
  }
}
ObjectDefineProperties(Duplex.prototype, {
  writable: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writable')
  },
  writableHighWaterMark: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableHighWaterMark')
  },
  writableObjectMode: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableObjectMode')
  },
  writableBuffer: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableBuffer')
  },
  writableLength: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableLength')
  },
  writableFinished: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableFinished')
  },
  writableCorked: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableCorked')
  },
  writableEnded: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableEnded')
  },
  writableNeedDrain: {
    __proto__: null,
    ...ObjectGetOwnPropertyDescriptor(Writable.prototype, 'writableNeedDrain')
  },
  destroyed: {
    __proto__: null,
    get() {
      if (this._readableState === undefined || this._writableState === undefined) {
        return false
      }
      return this._readableState.destroyed && this._writableState.destroyed
    },
    set(value) {
      // Backward compatibility, the user is explicitly
      // managing destroyed.
      if (this._readableState && this._writableState) {
        this._readableState.destroyed = value
        this._writableState.destroyed = value
      }
    }
  }
})
let webStreamsAdapters

// Lazy to avoid circular references
function lazyWebStreams() {
  if (webStreamsAdapters === undefined) webStreamsAdapters = {}
  return webStreamsAdapters
}
Duplex.fromWeb = function (pair, options) {
  return lazyWebStreams().newStreamDuplexFromReadableWritablePair(pair, options)
}
Duplex.toWeb = function (duplex) {
  return lazyWebStreams().newReadableWritablePairFromDuplex(duplex)
}
let duplexify
Duplex.from = function (body) {
  if (!duplexify) {
    duplexify = require('./duplexify')
  }
  return duplexify(body, 'body')
}

},{"../../ours/primordials":27,"./duplexify":12,"./readable":19,"./writable":23}],12:[function(require,module,exports){
/* replacement start */

const process = require('process/')

/* replacement end */

;('use strict')
const bufferModule = require('buffer')
const {
  isReadable,
  isWritable,
  isIterable,
  isNodeStream,
  isReadableNodeStream,
  isWritableNodeStream,
  isDuplexNodeStream,
  isReadableStream,
  isWritableStream
} = require('./utils')
const eos = require('./end-of-stream')
const {
  AbortError,
  codes: { ERR_INVALID_ARG_TYPE, ERR_INVALID_RETURN_VALUE }
} = require('../../ours/errors')
const { destroyer } = require('./destroy')
const Duplex = require('./duplex')
const Readable = require('./readable')
const Writable = require('./writable')
const { createDeferredPromise } = require('../../ours/util')
const from = require('./from')
const Blob = globalThis.Blob || bufferModule.Blob
const isBlob =
  typeof Blob !== 'undefined'
    ? function isBlob(b) {
        return b instanceof Blob
      }
    : function isBlob(b) {
        return false
      }
const AbortController = globalThis.AbortController || require('abort-controller').AbortController
const { FunctionPrototypeCall } = require('../../ours/primordials')

// This is needed for pre node 17.
class Duplexify extends Duplex {
  constructor(options) {
    super(options)

    // https://github.com/nodejs/node/pull/34385

    if ((options === null || options === undefined ? undefined : options.readable) === false) {
      this._readableState.readable = false
      this._readableState.ended = true
      this._readableState.endEmitted = true
    }
    if ((options === null || options === undefined ? undefined : options.writable) === false) {
      this._writableState.writable = false
      this._writableState.ending = true
      this._writableState.ended = true
      this._writableState.finished = true
    }
  }
}
module.exports = function duplexify(body, name) {
  if (isDuplexNodeStream(body)) {
    return body
  }
  if (isReadableNodeStream(body)) {
    return _duplexify({
      readable: body
    })
  }
  if (isWritableNodeStream(body)) {
    return _duplexify({
      writable: body
    })
  }
  if (isNodeStream(body)) {
    return _duplexify({
      writable: false,
      readable: false
    })
  }
  if (isReadableStream(body)) {
    return _duplexify({
      readable: Readable.fromWeb(body)
    })
  }
  if (isWritableStream(body)) {
    return _duplexify({
      writable: Writable.fromWeb(body)
    })
  }
  if (typeof body === 'function') {
    const { value, write, final, destroy } = fromAsyncGen(body)
    if (isIterable(value)) {
      return from(Duplexify, value, {
        // TODO (ronag): highWaterMark?
        objectMode: true,
        write,
        final,
        destroy
      })
    }
    const then = value === null || value === undefined ? undefined : value.then
    if (typeof then === 'function') {
      let d
      const promise = FunctionPrototypeCall(
        then,
        value,
        (val) => {
          if (val != null) {
            throw new ERR_INVALID_RETURN_VALUE('nully', 'body', val)
          }
        },
        (err) => {
          destroyer(d, err)
        }
      )
      return (d = new Duplexify({
        // TODO (ronag): highWaterMark?
        objectMode: true,
        readable: false,
        write,
        final(cb) {
          final(async () => {
            try {
              await promise
              process.nextTick(cb, null)
            } catch (err) {
              process.nextTick(cb, err)
            }
          })
        },
        destroy
      }))
    }
    throw new ERR_INVALID_RETURN_VALUE('Iterable, AsyncIterable or AsyncFunction', name, value)
  }
  if (isBlob(body)) {
    return duplexify(body.arrayBuffer())
  }
  if (isIterable(body)) {
    return from(Duplexify, body, {
      // TODO (ronag): highWaterMark?
      objectMode: true,
      writable: false
    })
  }
  if (
    isReadableStream(body === null || body === undefined ? undefined : body.readable) &&
    isWritableStream(body === null || body === undefined ? undefined : body.writable)
  ) {
    return Duplexify.fromWeb(body)
  }
  if (
    typeof (body === null || body === undefined ? undefined : body.writable) === 'object' ||
    typeof (body === null || body === undefined ? undefined : body.readable) === 'object'
  ) {
    const readable =
      body !== null && body !== undefined && body.readable
        ? isReadableNodeStream(body === null || body === undefined ? undefined : body.readable)
          ? body === null || body === undefined
            ? undefined
            : body.readable
          : duplexify(body.readable)
        : undefined
    const writable =
      body !== null && body !== undefined && body.writable
        ? isWritableNodeStream(body === null || body === undefined ? undefined : body.writable)
          ? body === null || body === undefined
            ? undefined
            : body.writable
          : duplexify(body.writable)
        : undefined
    return _duplexify({
      readable,
      writable
    })
  }
  const then = body === null || body === undefined ? undefined : body.then
  if (typeof then === 'function') {
    let d
    FunctionPrototypeCall(
      then,
      body,
      (val) => {
        if (val != null) {
          d.push(val)
        }
        d.push(null)
      },
      (err) => {
        destroyer(d, err)
      }
    )
    return (d = new Duplexify({
      objectMode: true,
      writable: false,
      read() {}
    }))
  }
  throw new ERR_INVALID_ARG_TYPE(
    name,
    [
      'Blob',
      'ReadableStream',
      'WritableStream',
      'Stream',
      'Iterable',
      'AsyncIterable',
      'Function',
      '{ readable, writable } pair',
      'Promise'
    ],
    body
  )
}
function fromAsyncGen(fn) {
  let { promise, resolve } = createDeferredPromise()
  const ac = new AbortController()
  const signal = ac.signal
  const value = fn(
    (async function* () {
      while (true) {
        const _promise = promise
        promise = null
        const { chunk, done, cb } = await _promise
        process.nextTick(cb)
        if (done) return
        if (signal.aborted)
          throw new AbortError(undefined, {
            cause: signal.reason
          })
        ;({ promise, resolve } = createDeferredPromise())
        yield chunk
      }
    })(),
    {
      signal
    }
  )
  return {
    value,
    write(chunk, encoding, cb) {
      const _resolve = resolve
      resolve = null
      _resolve({
        chunk,
        done: false,
        cb
      })
    },
    final(cb) {
      const _resolve = resolve
      resolve = null
      _resolve({
        done: true,
        cb
      })
    },
    destroy(err, cb) {
      ac.abort()
      cb(err)
    }
  }
}
function _duplexify(pair) {
  const r = pair.readable && typeof pair.readable.read !== 'function' ? Readable.wrap(pair.readable) : pair.readable
  const w = pair.writable
  let readable = !!isReadable(r)
  let writable = !!isWritable(w)
  let ondrain
  let onfinish
  let onreadable
  let onclose
  let d
  function onfinished(err) {
    const cb = onclose
    onclose = null
    if (cb) {
      cb(err)
    } else if (err) {
      d.destroy(err)
    }
  }

  // TODO(ronag): Avoid double buffering.
  // Implement Writable/Readable/Duplex traits.
  // See, https://github.com/nodejs/node/pull/33515.
  d = new Duplexify({
    // TODO (ronag): highWaterMark?
    readableObjectMode: !!(r !== null && r !== undefined && r.readableObjectMode),
    writableObjectMode: !!(w !== null && w !== undefined && w.writableObjectMode),
    readable,
    writable
  })
  if (writable) {
    eos(w, (err) => {
      writable = false
      if (err) {
        destroyer(r, err)
      }
      onfinished(err)
    })
    d._write = function (chunk, encoding, callback) {
      if (w.write(chunk, encoding)) {
        callback()
      } else {
        ondrain = callback
      }
    }
    d._final = function (callback) {
      w.end()
      onfinish = callback
    }
    w.on('drain', function () {
      if (ondrain) {
        const cb = ondrain
        ondrain = null
        cb()
      }
    })
    w.on('finish', function () {
      if (onfinish) {
        const cb = onfinish
        onfinish = null
        cb()
      }
    })
  }
  if (readable) {
    eos(r, (err) => {
      readable = false
      if (err) {
        destroyer(r, err)
      }
      onfinished(err)
    })
    r.on('readable', function () {
      if (onreadable) {
        const cb = onreadable
        onreadable = null
        cb()
      }
    })
    r.on('end', function () {
      d.push(null)
    })
    d._read = function () {
      while (true) {
        const buf = r.read()
        if (buf === null) {
          onreadable = d._read
          return
        }
        if (!d.push(buf)) {
          return
        }
      }
    }
  }
  d._destroy = function (err, callback) {
    if (!err && onclose !== null) {
      err = new AbortError()
    }
    onreadable = null
    ondrain = null
    onfinish = null
    if (onclose === null) {
      callback(err)
    } else {
      onclose = callback
      destroyer(w, err)
      destroyer(r, err)
    }
  }
  return d
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"./destroy":10,"./duplex":11,"./end-of-stream":13,"./from":14,"./readable":19,"./utils":22,"./writable":23,"abort-controller":1,"buffer":3,"process/":31}],13:[function(require,module,exports){
/* replacement start */

const process = require('process/')

/* replacement end */
// Ported from https://github.com/mafintosh/end-of-stream with
// permission from the author, Mathias Buus (@mafintosh).

;('use strict')
const { AbortError, codes } = require('../../ours/errors')
const { ERR_INVALID_ARG_TYPE, ERR_STREAM_PREMATURE_CLOSE } = codes
const { kEmptyObject, once } = require('../../ours/util')
const { validateAbortSignal, validateFunction, validateObject, validateBoolean } = require('../validators')
const { Promise, PromisePrototypeThen, SymbolDispose } = require('../../ours/primordials')
const {
  isClosed,
  isReadable,
  isReadableNodeStream,
  isReadableStream,
  isReadableFinished,
  isReadableErrored,
  isWritable,
  isWritableNodeStream,
  isWritableStream,
  isWritableFinished,
  isWritableErrored,
  isNodeStream,
  willEmitClose: _willEmitClose,
  kIsClosedPromise
} = require('./utils')
let addAbortListener
function isRequest(stream) {
  return stream.setHeader && typeof stream.abort === 'function'
}
const nop = () => {}
function eos(stream, options, callback) {
  var _options$readable, _options$writable
  if (arguments.length === 2) {
    callback = options
    options = kEmptyObject
  } else if (options == null) {
    options = kEmptyObject
  } else {
    validateObject(options, 'options')
  }
  validateFunction(callback, 'callback')
  validateAbortSignal(options.signal, 'options.signal')
  callback = once(callback)
  if (isReadableStream(stream) || isWritableStream(stream)) {
    return eosWeb(stream, options, callback)
  }
  if (!isNodeStream(stream)) {
    throw new ERR_INVALID_ARG_TYPE('stream', ['ReadableStream', 'WritableStream', 'Stream'], stream)
  }
  const readable =
    (_options$readable = options.readable) !== null && _options$readable !== undefined
      ? _options$readable
      : isReadableNodeStream(stream)
  const writable =
    (_options$writable = options.writable) !== null && _options$writable !== undefined
      ? _options$writable
      : isWritableNodeStream(stream)
  const wState = stream._writableState
  const rState = stream._readableState
  const onlegacyfinish = () => {
    if (!stream.writable) {
      onfinish()
    }
  }

  // TODO (ronag): Improve soft detection to include core modules and
  // common ecosystem modules that do properly emit 'close' but fail
  // this generic check.
  let willEmitClose =
    _willEmitClose(stream) && isReadableNodeStream(stream) === readable && isWritableNodeStream(stream) === writable
  let writableFinished = isWritableFinished(stream, false)
  const onfinish = () => {
    writableFinished = true
    // Stream should not be destroyed here. If it is that
    // means that user space is doing something differently and
    // we cannot trust willEmitClose.
    if (stream.destroyed) {
      willEmitClose = false
    }
    if (willEmitClose && (!stream.readable || readable)) {
      return
    }
    if (!readable || readableFinished) {
      callback.call(stream)
    }
  }
  let readableFinished = isReadableFinished(stream, false)
  const onend = () => {
    readableFinished = true
    // Stream should not be destroyed here. If it is that
    // means that user space is doing something differently and
    // we cannot trust willEmitClose.
    if (stream.destroyed) {
      willEmitClose = false
    }
    if (willEmitClose && (!stream.writable || writable)) {
      return
    }
    if (!writable || writableFinished) {
      callback.call(stream)
    }
  }
  const onerror = (err) => {
    callback.call(stream, err)
  }
  let closed = isClosed(stream)
  const onclose = () => {
    closed = true
    const errored = isWritableErrored(stream) || isReadableErrored(stream)
    if (errored && typeof errored !== 'boolean') {
      return callback.call(stream, errored)
    }
    if (readable && !readableFinished && isReadableNodeStream(stream, true)) {
      if (!isReadableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE())
    }
    if (writable && !writableFinished) {
      if (!isWritableFinished(stream, false)) return callback.call(stream, new ERR_STREAM_PREMATURE_CLOSE())
    }
    callback.call(stream)
  }
  const onclosed = () => {
    closed = true
    const errored = isWritableErrored(stream) || isReadableErrored(stream)
    if (errored && typeof errored !== 'boolean') {
      return callback.call(stream, errored)
    }
    callback.call(stream)
  }
  const onrequest = () => {
    stream.req.on('finish', onfinish)
  }
  if (isRequest(stream)) {
    stream.on('complete', onfinish)
    if (!willEmitClose) {
      stream.on('abort', onclose)
    }
    if (stream.req) {
      onrequest()
    } else {
      stream.on('request', onrequest)
    }
  } else if (writable && !wState) {
    // legacy streams
    stream.on('end', onlegacyfinish)
    stream.on('close', onlegacyfinish)
  }

  // Not all streams will emit 'close' after 'aborted'.
  if (!willEmitClose && typeof stream.aborted === 'boolean') {
    stream.on('aborted', onclose)
  }
  stream.on('end', onend)
  stream.on('finish', onfinish)
  if (options.error !== false) {
    stream.on('error', onerror)
  }
  stream.on('close', onclose)
  if (closed) {
    process.nextTick(onclose)
  } else if (
    (wState !== null && wState !== undefined && wState.errorEmitted) ||
    (rState !== null && rState !== undefined && rState.errorEmitted)
  ) {
    if (!willEmitClose) {
      process.nextTick(onclosed)
    }
  } else if (
    !readable &&
    (!willEmitClose || isReadable(stream)) &&
    (writableFinished || isWritable(stream) === false)
  ) {
    process.nextTick(onclosed)
  } else if (
    !writable &&
    (!willEmitClose || isWritable(stream)) &&
    (readableFinished || isReadable(stream) === false)
  ) {
    process.nextTick(onclosed)
  } else if (rState && stream.req && stream.aborted) {
    process.nextTick(onclosed)
  }
  const cleanup = () => {
    callback = nop
    stream.removeListener('aborted', onclose)
    stream.removeListener('complete', onfinish)
    stream.removeListener('abort', onclose)
    stream.removeListener('request', onrequest)
    if (stream.req) stream.req.removeListener('finish', onfinish)
    stream.removeListener('end', onlegacyfinish)
    stream.removeListener('close', onlegacyfinish)
    stream.removeListener('finish', onfinish)
    stream.removeListener('end', onend)
    stream.removeListener('error', onerror)
    stream.removeListener('close', onclose)
  }
  if (options.signal && !closed) {
    const abort = () => {
      // Keep it because cleanup removes it.
      const endCallback = callback
      cleanup()
      endCallback.call(
        stream,
        new AbortError(undefined, {
          cause: options.signal.reason
        })
      )
    }
    if (options.signal.aborted) {
      process.nextTick(abort)
    } else {
      addAbortListener = addAbortListener || require('../../ours/util').addAbortListener
      const disposable = addAbortListener(options.signal, abort)
      const originalCallback = callback
      callback = once((...args) => {
        disposable[SymbolDispose]()
        originalCallback.apply(stream, args)
      })
    }
  }
  return cleanup
}
function eosWeb(stream, options, callback) {
  let isAborted = false
  let abort = nop
  if (options.signal) {
    abort = () => {
      isAborted = true
      callback.call(
        stream,
        new AbortError(undefined, {
          cause: options.signal.reason
        })
      )
    }
    if (options.signal.aborted) {
      process.nextTick(abort)
    } else {
      addAbortListener = addAbortListener || require('../../ours/util').addAbortListener
      const disposable = addAbortListener(options.signal, abort)
      const originalCallback = callback
      callback = once((...args) => {
        disposable[SymbolDispose]()
        originalCallback.apply(stream, args)
      })
    }
  }
  const resolverFn = (...args) => {
    if (!isAborted) {
      process.nextTick(() => callback.apply(stream, args))
    }
  }
  PromisePrototypeThen(stream[kIsClosedPromise].promise, resolverFn, resolverFn)
  return nop
}
function finished(stream, opts) {
  var _opts
  let autoCleanup = false
  if (opts === null) {
    opts = kEmptyObject
  }
  if ((_opts = opts) !== null && _opts !== undefined && _opts.cleanup) {
    validateBoolean(opts.cleanup, 'cleanup')
    autoCleanup = opts.cleanup
  }
  return new Promise((resolve, reject) => {
    const cleanup = eos(stream, opts, (err) => {
      if (autoCleanup) {
        cleanup()
      }
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}
module.exports = eos
module.exports.finished = finished

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"../validators":24,"./utils":22,"process/":31}],14:[function(require,module,exports){
'use strict'

/* replacement start */

const process = require('process/')

/* replacement end */

const { PromisePrototypeThen, SymbolAsyncIterator, SymbolIterator } = require('../../ours/primordials')
const { Buffer } = require('buffer')
const { ERR_INVALID_ARG_TYPE, ERR_STREAM_NULL_VALUES } = require('../../ours/errors').codes
function from(Readable, iterable, opts) {
  let iterator
  if (typeof iterable === 'string' || iterable instanceof Buffer) {
    return new Readable({
      objectMode: true,
      ...opts,
      read() {
        this.push(iterable)
        this.push(null)
      }
    })
  }
  let isAsync
  if (iterable && iterable[SymbolAsyncIterator]) {
    isAsync = true
    iterator = iterable[SymbolAsyncIterator]()
  } else if (iterable && iterable[SymbolIterator]) {
    isAsync = false
    iterator = iterable[SymbolIterator]()
  } else {
    throw new ERR_INVALID_ARG_TYPE('iterable', ['Iterable'], iterable)
  }
  const readable = new Readable({
    objectMode: true,
    highWaterMark: 1,
    // TODO(ronag): What options should be allowed?
    ...opts
  })

  // Flag to protect against _read
  // being called before last iteration completion.
  let reading = false
  readable._read = function () {
    if (!reading) {
      reading = true
      next()
    }
  }
  readable._destroy = function (error, cb) {
    PromisePrototypeThen(
      close(error),
      () => process.nextTick(cb, error),
      // nextTick is here in case cb throws
      (e) => process.nextTick(cb, e || error)
    )
  }
  async function close(error) {
    const hadError = error !== undefined && error !== null
    const hasThrow = typeof iterator.throw === 'function'
    if (hadError && hasThrow) {
      const { value, done } = await iterator.throw(error)
      await value
      if (done) {
        return
      }
    }
    if (typeof iterator.return === 'function') {
      const { value } = await iterator.return()
      await value
    }
  }
  async function next() {
    for (;;) {
      try {
        const { value, done } = isAsync ? await iterator.next() : iterator.next()
        if (done) {
          readable.push(null)
        } else {
          const res = value && typeof value.then === 'function' ? await value : value
          if (res === null) {
            reading = false
            throw new ERR_STREAM_NULL_VALUES()
          } else if (readable.push(res)) {
            continue
          } else {
            reading = false
          }
        }
      } catch (err) {
        readable.destroy(err)
      }
      break
    }
  }
  return readable
}
module.exports = from

},{"../../ours/errors":26,"../../ours/primordials":27,"buffer":3,"process/":31}],15:[function(require,module,exports){
'use strict'

const { ArrayIsArray, ObjectSetPrototypeOf } = require('../../ours/primordials')
const { EventEmitter: EE } = require('events')
function Stream(opts) {
  EE.call(this, opts)
}
ObjectSetPrototypeOf(Stream.prototype, EE.prototype)
ObjectSetPrototypeOf(Stream, EE)
Stream.prototype.pipe = function (dest, options) {
  const source = this
  function ondata(chunk) {
    if (dest.writable && dest.write(chunk) === false && source.pause) {
      source.pause()
    }
  }
  source.on('data', ondata)
  function ondrain() {
    if (source.readable && source.resume) {
      source.resume()
    }
  }
  dest.on('drain', ondrain)

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend)
    source.on('close', onclose)
  }
  let didOnEnd = false
  function onend() {
    if (didOnEnd) return
    didOnEnd = true
    dest.end()
  }
  function onclose() {
    if (didOnEnd) return
    didOnEnd = true
    if (typeof dest.destroy === 'function') dest.destroy()
  }

  // Don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup()
    if (EE.listenerCount(this, 'error') === 0) {
      this.emit('error', er)
    }
  }
  prependListener(source, 'error', onerror)
  prependListener(dest, 'error', onerror)

  // Remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata)
    dest.removeListener('drain', ondrain)
    source.removeListener('end', onend)
    source.removeListener('close', onclose)
    source.removeListener('error', onerror)
    dest.removeListener('error', onerror)
    source.removeListener('end', cleanup)
    source.removeListener('close', cleanup)
    dest.removeListener('close', cleanup)
  }
  source.on('end', cleanup)
  source.on('close', cleanup)
  dest.on('close', cleanup)
  dest.emit('pipe', source)

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest
}
function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn)

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn)
  else if (ArrayIsArray(emitter._events[event])) emitter._events[event].unshift(fn)
  else emitter._events[event] = [fn, emitter._events[event]]
}
module.exports = {
  Stream,
  prependListener
}

},{"../../ours/primordials":27,"events":4}],16:[function(require,module,exports){
'use strict'

const AbortController = globalThis.AbortController || require('abort-controller').AbortController
const {
  codes: { ERR_INVALID_ARG_VALUE, ERR_INVALID_ARG_TYPE, ERR_MISSING_ARGS, ERR_OUT_OF_RANGE },
  AbortError
} = require('../../ours/errors')
const { validateAbortSignal, validateInteger, validateObject } = require('../validators')
const kWeakHandler = require('../../ours/primordials').Symbol('kWeak')
const kResistStopPropagation = require('../../ours/primordials').Symbol('kResistStopPropagation')
const { finished } = require('./end-of-stream')
const staticCompose = require('./compose')
const { addAbortSignalNoValidate } = require('./add-abort-signal')
const { isWritable, isNodeStream } = require('./utils')
const { deprecate } = require('../../ours/util')
const {
  ArrayPrototypePush,
  Boolean,
  MathFloor,
  Number,
  NumberIsNaN,
  Promise,
  PromiseReject,
  PromiseResolve,
  PromisePrototypeThen,
  Symbol
} = require('../../ours/primordials')
const kEmpty = Symbol('kEmpty')
const kEof = Symbol('kEof')
function compose(stream, options) {
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  if (isNodeStream(stream) && !isWritable(stream)) {
    throw new ERR_INVALID_ARG_VALUE('stream', stream, 'must be writable')
  }
  const composedStream = staticCompose(this, stream)
  if (options !== null && options !== undefined && options.signal) {
    // Not validating as we already validated before
    addAbortSignalNoValidate(options.signal, composedStream)
  }
  return composedStream
}
function map(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  let concurrency = 1
  if ((options === null || options === undefined ? undefined : options.concurrency) != null) {
    concurrency = MathFloor(options.concurrency)
  }
  let highWaterMark = concurrency - 1
  if ((options === null || options === undefined ? undefined : options.highWaterMark) != null) {
    highWaterMark = MathFloor(options.highWaterMark)
  }
  validateInteger(concurrency, 'options.concurrency', 1)
  validateInteger(highWaterMark, 'options.highWaterMark', 0)
  highWaterMark += concurrency
  return async function* map() {
    const signal = require('../../ours/util').AbortSignalAny(
      [options === null || options === undefined ? undefined : options.signal].filter(Boolean)
    )
    const stream = this
    const queue = []
    const signalOpt = {
      signal
    }
    let next
    let resume
    let done = false
    let cnt = 0
    function onCatch() {
      done = true
      afterItemProcessed()
    }
    function afterItemProcessed() {
      cnt -= 1
      maybeResume()
    }
    function maybeResume() {
      if (resume && !done && cnt < concurrency && queue.length < highWaterMark) {
        resume()
        resume = null
      }
    }
    async function pump() {
      try {
        for await (let val of stream) {
          if (done) {
            return
          }
          if (signal.aborted) {
            throw new AbortError()
          }
          try {
            val = fn(val, signalOpt)
            if (val === kEmpty) {
              continue
            }
            val = PromiseResolve(val)
          } catch (err) {
            val = PromiseReject(err)
          }
          cnt += 1
          PromisePrototypeThen(val, afterItemProcessed, onCatch)
          queue.push(val)
          if (next) {
            next()
            next = null
          }
          if (!done && (queue.length >= highWaterMark || cnt >= concurrency)) {
            await new Promise((resolve) => {
              resume = resolve
            })
          }
        }
        queue.push(kEof)
      } catch (err) {
        const val = PromiseReject(err)
        PromisePrototypeThen(val, afterItemProcessed, onCatch)
        queue.push(val)
      } finally {
        done = true
        if (next) {
          next()
          next = null
        }
      }
    }
    pump()
    try {
      while (true) {
        while (queue.length > 0) {
          const val = await queue[0]
          if (val === kEof) {
            return
          }
          if (signal.aborted) {
            throw new AbortError()
          }
          if (val !== kEmpty) {
            yield val
          }
          queue.shift()
          maybeResume()
        }
        await new Promise((resolve) => {
          next = resolve
        })
      }
    } finally {
      done = true
      if (resume) {
        resume()
        resume = null
      }
    }
  }.call(this)
}
function asIndexedPairs(options = undefined) {
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  return async function* asIndexedPairs() {
    let index = 0
    for await (const val of this) {
      var _options$signal
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal = options.signal) !== null &&
        _options$signal !== undefined &&
        _options$signal.aborted
      ) {
        throw new AbortError({
          cause: options.signal.reason
        })
      }
      yield [index++, val]
    }
  }.call(this)
}
async function some(fn, options = undefined) {
  for await (const unused of filter.call(this, fn, options)) {
    return true
  }
  return false
}
async function every(fn, options = undefined) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  // https://en.wikipedia.org/wiki/De_Morgan%27s_laws
  return !(await some.call(
    this,
    async (...args) => {
      return !(await fn(...args))
    },
    options
  ))
}
async function find(fn, options) {
  for await (const result of filter.call(this, fn, options)) {
    return result
  }
  return undefined
}
async function forEach(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  async function forEachFn(value, options) {
    await fn(value, options)
    return kEmpty
  }
  // eslint-disable-next-line no-unused-vars
  for await (const unused of map.call(this, forEachFn, options));
}
function filter(fn, options) {
  if (typeof fn !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('fn', ['Function', 'AsyncFunction'], fn)
  }
  async function filterFn(value, options) {
    if (await fn(value, options)) {
      return value
    }
    return kEmpty
  }
  return map.call(this, filterFn, options)
}

// Specific to provide better error to reduce since the argument is only
// missing if the stream has no items in it - but the code is still appropriate
class ReduceAwareErrMissingArgs extends ERR_MISSING_ARGS {
  constructor() {
    super('reduce')
    this.message = 'Reduce of an empty stream requires an initial value'
  }
}
async function reduce(reducer, initialValue, options) {
  var _options$signal2
  if (typeof reducer !== 'function') {
    throw new ERR_INVALID_ARG_TYPE('reducer', ['Function', 'AsyncFunction'], reducer)
  }
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  let hasInitialValue = arguments.length > 1
  if (
    options !== null &&
    options !== undefined &&
    (_options$signal2 = options.signal) !== null &&
    _options$signal2 !== undefined &&
    _options$signal2.aborted
  ) {
    const err = new AbortError(undefined, {
      cause: options.signal.reason
    })
    this.once('error', () => {}) // The error is already propagated
    await finished(this.destroy(err))
    throw err
  }
  const ac = new AbortController()
  const signal = ac.signal
  if (options !== null && options !== undefined && options.signal) {
    const opts = {
      once: true,
      [kWeakHandler]: this,
      [kResistStopPropagation]: true
    }
    options.signal.addEventListener('abort', () => ac.abort(), opts)
  }
  let gotAnyItemFromStream = false
  try {
    for await (const value of this) {
      var _options$signal3
      gotAnyItemFromStream = true
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal3 = options.signal) !== null &&
        _options$signal3 !== undefined &&
        _options$signal3.aborted
      ) {
        throw new AbortError()
      }
      if (!hasInitialValue) {
        initialValue = value
        hasInitialValue = true
      } else {
        initialValue = await reducer(initialValue, value, {
          signal
        })
      }
    }
    if (!gotAnyItemFromStream && !hasInitialValue) {
      throw new ReduceAwareErrMissingArgs()
    }
  } finally {
    ac.abort()
  }
  return initialValue
}
async function toArray(options) {
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  const result = []
  for await (const val of this) {
    var _options$signal4
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal4 = options.signal) !== null &&
      _options$signal4 !== undefined &&
      _options$signal4.aborted
    ) {
      throw new AbortError(undefined, {
        cause: options.signal.reason
      })
    }
    ArrayPrototypePush(result, val)
  }
  return result
}
function flatMap(fn, options) {
  const values = map.call(this, fn, options)
  return async function* flatMap() {
    for await (const val of values) {
      yield* val
    }
  }.call(this)
}
function toIntegerOrInfinity(number) {
  // We coerce here to align with the spec
  // https://github.com/tc39/proposal-iterator-helpers/issues/169
  number = Number(number)
  if (NumberIsNaN(number)) {
    return 0
  }
  if (number < 0) {
    throw new ERR_OUT_OF_RANGE('number', '>= 0', number)
  }
  return number
}
function drop(number, options = undefined) {
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  number = toIntegerOrInfinity(number)
  return async function* drop() {
    var _options$signal5
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal5 = options.signal) !== null &&
      _options$signal5 !== undefined &&
      _options$signal5.aborted
    ) {
      throw new AbortError()
    }
    for await (const val of this) {
      var _options$signal6
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal6 = options.signal) !== null &&
        _options$signal6 !== undefined &&
        _options$signal6.aborted
      ) {
        throw new AbortError()
      }
      if (number-- <= 0) {
        yield val
      }
    }
  }.call(this)
}
function take(number, options = undefined) {
  if (options != null) {
    validateObject(options, 'options')
  }
  if ((options === null || options === undefined ? undefined : options.signal) != null) {
    validateAbortSignal(options.signal, 'options.signal')
  }
  number = toIntegerOrInfinity(number)
  return async function* take() {
    var _options$signal7
    if (
      options !== null &&
      options !== undefined &&
      (_options$signal7 = options.signal) !== null &&
      _options$signal7 !== undefined &&
      _options$signal7.aborted
    ) {
      throw new AbortError()
    }
    for await (const val of this) {
      var _options$signal8
      if (
        options !== null &&
        options !== undefined &&
        (_options$signal8 = options.signal) !== null &&
        _options$signal8 !== undefined &&
        _options$signal8.aborted
      ) {
        throw new AbortError()
      }
      if (number-- > 0) {
        yield val
      }

      // Don't get another item from iterator in case we reached the end
      if (number <= 0) {
        return
      }
    }
  }.call(this)
}
module.exports.streamReturningOperators = {
  asIndexedPairs: deprecate(asIndexedPairs, 'readable.asIndexedPairs will be removed in a future version.'),
  drop,
  filter,
  flatMap,
  map,
  take,
  compose
}
module.exports.promiseReturningOperators = {
  every,
  forEach,
  reduce,
  toArray,
  some,
  find
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"../validators":24,"./add-abort-signal":7,"./compose":9,"./end-of-stream":13,"./utils":22,"abort-controller":1}],17:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict'

const { ObjectSetPrototypeOf } = require('../../ours/primordials')
module.exports = PassThrough
const Transform = require('./transform')
ObjectSetPrototypeOf(PassThrough.prototype, Transform.prototype)
ObjectSetPrototypeOf(PassThrough, Transform)
function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options)
  Transform.call(this, options)
}
PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk)
}

},{"../../ours/primordials":27,"./transform":21}],18:[function(require,module,exports){
/* replacement start */

const process = require('process/')

/* replacement end */
// Ported from https://github.com/mafintosh/pump with
// permission from the author, Mathias Buus (@mafintosh).

;('use strict')
const { ArrayIsArray, Promise, SymbolAsyncIterator, SymbolDispose } = require('../../ours/primordials')
const eos = require('./end-of-stream')
const { once } = require('../../ours/util')
const destroyImpl = require('./destroy')
const Duplex = require('./duplex')
const {
  aggregateTwoErrors,
  codes: {
    ERR_INVALID_ARG_TYPE,
    ERR_INVALID_RETURN_VALUE,
    ERR_MISSING_ARGS,
    ERR_STREAM_DESTROYED,
    ERR_STREAM_PREMATURE_CLOSE
  },
  AbortError
} = require('../../ours/errors')
const { validateFunction, validateAbortSignal } = require('../validators')
const {
  isIterable,
  isReadable,
  isReadableNodeStream,
  isNodeStream,
  isTransformStream,
  isWebStream,
  isReadableStream,
  isReadableFinished
} = require('./utils')
const AbortController = globalThis.AbortController || require('abort-controller').AbortController
let PassThrough
let Readable
let addAbortListener
function destroyer(stream, reading, writing) {
  let finished = false
  stream.on('close', () => {
    finished = true
  })
  const cleanup = eos(
    stream,
    {
      readable: reading,
      writable: writing
    },
    (err) => {
      finished = !err
    }
  )
  return {
    destroy: (err) => {
      if (finished) return
      finished = true
      destroyImpl.destroyer(stream, err || new ERR_STREAM_DESTROYED('pipe'))
    },
    cleanup
  }
}
function popCallback(streams) {
  // Streams should never be an empty array. It should always contain at least
  // a single stream. Therefore optimize for the average case instead of
  // checking for length === 0 as well.
  validateFunction(streams[streams.length - 1], 'streams[stream.length - 1]')
  return streams.pop()
}
function makeAsyncIterable(val) {
  if (isIterable(val)) {
    return val
  } else if (isReadableNodeStream(val)) {
    // Legacy streams are not Iterable.
    return fromReadable(val)
  }
  throw new ERR_INVALID_ARG_TYPE('val', ['Readable', 'Iterable', 'AsyncIterable'], val)
}
async function* fromReadable(val) {
  if (!Readable) {
    Readable = require('./readable')
  }
  yield* Readable.prototype[SymbolAsyncIterator].call(val)
}
async function pumpToNode(iterable, writable, finish, { end }) {
  let error
  let onresolve = null
  const resume = (err) => {
    if (err) {
      error = err
    }
    if (onresolve) {
      const callback = onresolve
      onresolve = null
      callback()
    }
  }
  const wait = () =>
    new Promise((resolve, reject) => {
      if (error) {
        reject(error)
      } else {
        onresolve = () => {
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        }
      }
    })
  writable.on('drain', resume)
  const cleanup = eos(
    writable,
    {
      readable: false
    },
    resume
  )
  try {
    if (writable.writableNeedDrain) {
      await wait()
    }
    for await (const chunk of iterable) {
      if (!writable.write(chunk)) {
        await wait()
      }
    }
    if (end) {
      writable.end()
      await wait()
    }
    finish()
  } catch (err) {
    finish(error !== err ? aggregateTwoErrors(error, err) : err)
  } finally {
    cleanup()
    writable.off('drain', resume)
  }
}
async function pumpToWeb(readable, writable, finish, { end }) {
  if (isTransformStream(writable)) {
    writable = writable.writable
  }
  // https://streams.spec.whatwg.org/#example-manual-write-with-backpressure
  const writer = writable.getWriter()
  try {
    for await (const chunk of readable) {
      await writer.ready
      writer.write(chunk).catch(() => {})
    }
    await writer.ready
    if (end) {
      await writer.close()
    }
    finish()
  } catch (err) {
    try {
      await writer.abort(err)
      finish(err)
    } catch (err) {
      finish(err)
    }
  }
}
function pipeline(...streams) {
  return pipelineImpl(streams, once(popCallback(streams)))
}
function pipelineImpl(streams, callback, opts) {
  if (streams.length === 1 && ArrayIsArray(streams[0])) {
    streams = streams[0]
  }
  if (streams.length < 2) {
    throw new ERR_MISSING_ARGS('streams')
  }
  const ac = new AbortController()
  const signal = ac.signal
  const outerSignal = opts === null || opts === undefined ? undefined : opts.signal

  // Need to cleanup event listeners if last stream is readable
  // https://github.com/nodejs/node/issues/35452
  const lastStreamCleanup = []
  validateAbortSignal(outerSignal, 'options.signal')
  function abort() {
    finishImpl(new AbortError())
  }
  addAbortListener = addAbortListener || require('../../ours/util').addAbortListener
  let disposable
  if (outerSignal) {
    disposable = addAbortListener(outerSignal, abort)
  }
  let error
  let value
  const destroys = []
  let finishCount = 0
  function finish(err) {
    finishImpl(err, --finishCount === 0)
  }
  function finishImpl(err, final) {
    var _disposable
    if (err && (!error || error.code === 'ERR_STREAM_PREMATURE_CLOSE')) {
      error = err
    }
    if (!error && !final) {
      return
    }
    while (destroys.length) {
      destroys.shift()(error)
    }
    ;(_disposable = disposable) === null || _disposable === undefined ? undefined : _disposable[SymbolDispose]()
    ac.abort()
    if (final) {
      if (!error) {
        lastStreamCleanup.forEach((fn) => fn())
      }
      process.nextTick(callback, error, value)
    }
  }
  let ret
  for (let i = 0; i < streams.length; i++) {
    const stream = streams[i]
    const reading = i < streams.length - 1
    const writing = i > 0
    const end = reading || (opts === null || opts === undefined ? undefined : opts.end) !== false
    const isLastStream = i === streams.length - 1
    if (isNodeStream(stream)) {
      if (end) {
        const { destroy, cleanup } = destroyer(stream, reading, writing)
        destroys.push(destroy)
        if (isReadable(stream) && isLastStream) {
          lastStreamCleanup.push(cleanup)
        }
      }

      // Catch stream errors that occur after pipe/pump has completed.
      function onError(err) {
        if (err && err.name !== 'AbortError' && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
          finish(err)
        }
      }
      stream.on('error', onError)
      if (isReadable(stream) && isLastStream) {
        lastStreamCleanup.push(() => {
          stream.removeListener('error', onError)
        })
      }
    }
    if (i === 0) {
      if (typeof stream === 'function') {
        ret = stream({
          signal
        })
        if (!isIterable(ret)) {
          throw new ERR_INVALID_RETURN_VALUE('Iterable, AsyncIterable or Stream', 'source', ret)
        }
      } else if (isIterable(stream) || isReadableNodeStream(stream) || isTransformStream(stream)) {
        ret = stream
      } else {
        ret = Duplex.from(stream)
      }
    } else if (typeof stream === 'function') {
      if (isTransformStream(ret)) {
        var _ret
        ret = makeAsyncIterable((_ret = ret) === null || _ret === undefined ? undefined : _ret.readable)
      } else {
        ret = makeAsyncIterable(ret)
      }
      ret = stream(ret, {
        signal
      })
      if (reading) {
        if (!isIterable(ret, true)) {
          throw new ERR_INVALID_RETURN_VALUE('AsyncIterable', `transform[${i - 1}]`, ret)
        }
      } else {
        var _ret2
        if (!PassThrough) {
          PassThrough = require('./passthrough')
        }

        // If the last argument to pipeline is not a stream
        // we must create a proxy stream so that pipeline(...)
        // always returns a stream which can be further
        // composed through `.pipe(stream)`.

        const pt = new PassThrough({
          objectMode: true
        })

        // Handle Promises/A+ spec, `then` could be a getter that throws on
        // second use.
        const then = (_ret2 = ret) === null || _ret2 === undefined ? undefined : _ret2.then
        if (typeof then === 'function') {
          finishCount++
          then.call(
            ret,
            (val) => {
              value = val
              if (val != null) {
                pt.write(val)
              }
              if (end) {
                pt.end()
              }
              process.nextTick(finish)
            },
            (err) => {
              pt.destroy(err)
              process.nextTick(finish, err)
            }
          )
        } else if (isIterable(ret, true)) {
          finishCount++
          pumpToNode(ret, pt, finish, {
            end
          })
        } else if (isReadableStream(ret) || isTransformStream(ret)) {
          const toRead = ret.readable || ret
          finishCount++
          pumpToNode(toRead, pt, finish, {
            end
          })
        } else {
          throw new ERR_INVALID_RETURN_VALUE('AsyncIterable or Promise', 'destination', ret)
        }
        ret = pt
        const { destroy, cleanup } = destroyer(ret, false, true)
        destroys.push(destroy)
        if (isLastStream) {
          lastStreamCleanup.push(cleanup)
        }
      }
    } else if (isNodeStream(stream)) {
      if (isReadableNodeStream(ret)) {
        finishCount += 2
        const cleanup = pipe(ret, stream, finish, {
          end
        })
        if (isReadable(stream) && isLastStream) {
          lastStreamCleanup.push(cleanup)
        }
      } else if (isTransformStream(ret) || isReadableStream(ret)) {
        const toRead = ret.readable || ret
        finishCount++
        pumpToNode(toRead, stream, finish, {
          end
        })
      } else if (isIterable(ret)) {
        finishCount++
        pumpToNode(ret, stream, finish, {
          end
        })
      } else {
        throw new ERR_INVALID_ARG_TYPE(
          'val',
          ['Readable', 'Iterable', 'AsyncIterable', 'ReadableStream', 'TransformStream'],
          ret
        )
      }
      ret = stream
    } else if (isWebStream(stream)) {
      if (isReadableNodeStream(ret)) {
        finishCount++
        pumpToWeb(makeAsyncIterable(ret), stream, finish, {
          end
        })
      } else if (isReadableStream(ret) || isIterable(ret)) {
        finishCount++
        pumpToWeb(ret, stream, finish, {
          end
        })
      } else if (isTransformStream(ret)) {
        finishCount++
        pumpToWeb(ret.readable, stream, finish, {
          end
        })
      } else {
        throw new ERR_INVALID_ARG_TYPE(
          'val',
          ['Readable', 'Iterable', 'AsyncIterable', 'ReadableStream', 'TransformStream'],
          ret
        )
      }
      ret = stream
    } else {
      ret = Duplex.from(stream)
    }
  }
  if (
    (signal !== null && signal !== undefined && signal.aborted) ||
    (outerSignal !== null && outerSignal !== undefined && outerSignal.aborted)
  ) {
    process.nextTick(abort)
  }
  return ret
}
function pipe(src, dst, finish, { end }) {
  let ended = false
  dst.on('close', () => {
    if (!ended) {
      // Finish if the destination closes before the source has completed.
      finish(new ERR_STREAM_PREMATURE_CLOSE())
    }
  })
  src.pipe(dst, {
    end: false
  }) // If end is true we already will have a listener to end dst.

  if (end) {
    // Compat. Before node v10.12.0 stdio used to throw an error so
    // pipe() did/does not end() stdio destinations.
    // Now they allow it but "secretly" don't close the underlying fd.

    function endFn() {
      ended = true
      dst.end()
    }
    if (isReadableFinished(src)) {
      // End the destination if the source has already ended.
      process.nextTick(endFn)
    } else {
      src.once('end', endFn)
    }
  } else {
    finish()
  }
  eos(
    src,
    {
      readable: true,
      writable: false
    },
    (err) => {
      const rState = src._readableState
      if (
        err &&
        err.code === 'ERR_STREAM_PREMATURE_CLOSE' &&
        rState &&
        rState.ended &&
        !rState.errored &&
        !rState.errorEmitted
      ) {
        // Some readable streams will emit 'close' before 'end'. However, since
        // this is on the readable side 'end' should still be emitted if the
        // stream has been ended and no error emitted. This should be allowed in
        // favor of backwards compatibility. Since the stream is piped to a
        // destination this should not result in any observable difference.
        // We don't need to check if this is a writable premature close since
        // eos will only fail with premature close on the reading side for
        // duplex streams.
        src.once('end', finish).once('error', finish)
      } else {
        finish(err)
      }
    }
  )
  return eos(
    dst,
    {
      readable: false,
      writable: true
    },
    finish
  )
}
module.exports = {
  pipelineImpl,
  pipeline
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"../validators":24,"./destroy":10,"./duplex":11,"./end-of-stream":13,"./passthrough":17,"./readable":19,"./utils":22,"abort-controller":1,"process/":31}],19:[function(require,module,exports){
/* replacement start */

const process = require('process/')

/* replacement end */
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

;('use strict')
const {
  ArrayPrototypeIndexOf,
  NumberIsInteger,
  NumberIsNaN,
  NumberParseInt,
  ObjectDefineProperties,
  ObjectKeys,
  ObjectSetPrototypeOf,
  Promise,
  SafeSet,
  SymbolAsyncDispose,
  SymbolAsyncIterator,
  Symbol
} = require('../../ours/primordials')
module.exports = Readable
Readable.ReadableState = ReadableState
const { EventEmitter: EE } = require('events')
const { Stream, prependListener } = require('./legacy')
const { Buffer } = require('buffer')
const { addAbortSignal } = require('./add-abort-signal')
const eos = require('./end-of-stream')
let debug = require('../../ours/util').debuglog('stream', (fn) => {
  debug = fn
})
const BufferList = require('./buffer_list')
const destroyImpl = require('./destroy')
const { getHighWaterMark, getDefaultHighWaterMark } = require('./state')
const {
  aggregateTwoErrors,
  codes: {
    ERR_INVALID_ARG_TYPE,
    ERR_METHOD_NOT_IMPLEMENTED,
    ERR_OUT_OF_RANGE,
    ERR_STREAM_PUSH_AFTER_EOF,
    ERR_STREAM_UNSHIFT_AFTER_END_EVENT
  },
  AbortError
} = require('../../ours/errors')
const { validateObject } = require('../validators')
const kPaused = Symbol('kPaused')
const { StringDecoder } = require('string_decoder')
const from = require('./from')
ObjectSetPrototypeOf(Readable.prototype, Stream.prototype)
ObjectSetPrototypeOf(Readable, Stream)
const nop = () => {}
const { errorOrDestroy } = destroyImpl
const kObjectMode = 1 << 0
const kEnded = 1 << 1
const kEndEmitted = 1 << 2
const kReading = 1 << 3
const kConstructed = 1 << 4
const kSync = 1 << 5
const kNeedReadable = 1 << 6
const kEmittedReadable = 1 << 7
const kReadableListening = 1 << 8
const kResumeScheduled = 1 << 9
const kErrorEmitted = 1 << 10
const kEmitClose = 1 << 11
const kAutoDestroy = 1 << 12
const kDestroyed = 1 << 13
const kClosed = 1 << 14
const kCloseEmitted = 1 << 15
const kMultiAwaitDrain = 1 << 16
const kReadingMore = 1 << 17
const kDataEmitted = 1 << 18

// TODO(benjamingr) it is likely slower to do it this way than with free functions
function makeBitMapDescriptor(bit) {
  return {
    enumerable: false,
    get() {
      return (this.state & bit) !== 0
    },
    set(value) {
      if (value) this.state |= bit
      else this.state &= ~bit
    }
  }
}
ObjectDefineProperties(ReadableState.prototype, {
  objectMode: makeBitMapDescriptor(kObjectMode),
  ended: makeBitMapDescriptor(kEnded),
  endEmitted: makeBitMapDescriptor(kEndEmitted),
  reading: makeBitMapDescriptor(kReading),
  // Stream is still being constructed and cannot be
  // destroyed until construction finished or failed.
  // Async construction is opt in, therefore we start as
  // constructed.
  constructed: makeBitMapDescriptor(kConstructed),
  // A flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  sync: makeBitMapDescriptor(kSync),
  // Whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  needReadable: makeBitMapDescriptor(kNeedReadable),
  emittedReadable: makeBitMapDescriptor(kEmittedReadable),
  readableListening: makeBitMapDescriptor(kReadableListening),
  resumeScheduled: makeBitMapDescriptor(kResumeScheduled),
  // True if the error was already emitted and should not be thrown again.
  errorEmitted: makeBitMapDescriptor(kErrorEmitted),
  emitClose: makeBitMapDescriptor(kEmitClose),
  autoDestroy: makeBitMapDescriptor(kAutoDestroy),
  // Has it been destroyed.
  destroyed: makeBitMapDescriptor(kDestroyed),
  // Indicates whether the stream has finished destroying.
  closed: makeBitMapDescriptor(kClosed),
  // True if close has been emitted or would have been emitted
  // depending on emitClose.
  closeEmitted: makeBitMapDescriptor(kCloseEmitted),
  multiAwaitDrain: makeBitMapDescriptor(kMultiAwaitDrain),
  // If true, a maybeReadMore has been scheduled.
  readingMore: makeBitMapDescriptor(kReadingMore),
  dataEmitted: makeBitMapDescriptor(kDataEmitted)
})
function ReadableState(options, stream, isDuplex) {
  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof require('./duplex')

  // Bit map field to store ReadableState more effciently with 1 bit per field
  // instead of a V8 slot per field.
  this.state = kEmitClose | kAutoDestroy | kConstructed | kSync
  // Object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away.
  if (options && options.objectMode) this.state |= kObjectMode
  if (isDuplex && options && options.readableObjectMode) this.state |= kObjectMode

  // The point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  this.highWaterMark = options
    ? getHighWaterMark(this, options, 'readableHighWaterMark', isDuplex)
    : getDefaultHighWaterMark(false)

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift().
  this.buffer = new BufferList()
  this.length = 0
  this.pipes = []
  this.flowing = null
  this[kPaused] = null

  // Should close be emitted on destroy. Defaults to true.
  if (options && options.emitClose === false) this.state &= ~kEmitClose

  // Should .destroy() be called after 'end' (and potentially 'finish').
  if (options && options.autoDestroy === false) this.state &= ~kAutoDestroy

  // Indicates whether the stream has errored. When true no further
  // _read calls, 'data' or 'readable' events should occur. This is needed
  // since when autoDestroy is disabled we need a way to tell whether the
  // stream has failed.
  this.errored = null

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = (options && options.defaultEncoding) || 'utf8'

  // Ref the piped dest which we need a drain event on it
  // type: null | Writable | Set<Writable>.
  this.awaitDrainWriters = null
  this.decoder = null
  this.encoding = null
  if (options && options.encoding) {
    this.decoder = new StringDecoder(options.encoding)
    this.encoding = options.encoding
  }
}
function Readable(options) {
  if (!(this instanceof Readable)) return new Readable(options)

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the ReadableState constructor, at least with V8 6.5.
  const isDuplex = this instanceof require('./duplex')
  this._readableState = new ReadableState(options, this, isDuplex)
  if (options) {
    if (typeof options.read === 'function') this._read = options.read
    if (typeof options.destroy === 'function') this._destroy = options.destroy
    if (typeof options.construct === 'function') this._construct = options.construct
    if (options.signal && !isDuplex) addAbortSignal(options.signal, this)
  }
  Stream.call(this, options)
  destroyImpl.construct(this, () => {
    if (this._readableState.needReadable) {
      maybeReadMore(this, this._readableState)
    }
  })
}
Readable.prototype.destroy = destroyImpl.destroy
Readable.prototype._undestroy = destroyImpl.undestroy
Readable.prototype._destroy = function (err, cb) {
  cb(err)
}
Readable.prototype[EE.captureRejectionSymbol] = function (err) {
  this.destroy(err)
}
Readable.prototype[SymbolAsyncDispose] = function () {
  let error
  if (!this.destroyed) {
    error = this.readableEnded ? null : new AbortError()
    this.destroy(error)
  }
  return new Promise((resolve, reject) => eos(this, (err) => (err && err !== error ? reject(err) : resolve(null))))
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  return readableAddChunk(this, chunk, encoding, false)
}

// Unshift should *always* be something directly out of read().
Readable.prototype.unshift = function (chunk, encoding) {
  return readableAddChunk(this, chunk, encoding, true)
}
function readableAddChunk(stream, chunk, encoding, addToFront) {
  debug('readableAddChunk', chunk)
  const state = stream._readableState
  let err
  if ((state.state & kObjectMode) === 0) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding
      if (state.encoding !== encoding) {
        if (addToFront && state.encoding) {
          // When unshifting, if state.encoding is set, we have to save
          // the string in the BufferList with the state encoding.
          chunk = Buffer.from(chunk, encoding).toString(state.encoding)
        } else {
          chunk = Buffer.from(chunk, encoding)
          encoding = ''
        }
      }
    } else if (chunk instanceof Buffer) {
      encoding = ''
    } else if (Stream._isUint8Array(chunk)) {
      chunk = Stream._uint8ArrayToBuffer(chunk)
      encoding = ''
    } else if (chunk != null) {
      err = new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk)
    }
  }
  if (err) {
    errorOrDestroy(stream, err)
  } else if (chunk === null) {
    state.state &= ~kReading
    onEofChunk(stream, state)
  } else if ((state.state & kObjectMode) !== 0 || (chunk && chunk.length > 0)) {
    if (addToFront) {
      if ((state.state & kEndEmitted) !== 0) errorOrDestroy(stream, new ERR_STREAM_UNSHIFT_AFTER_END_EVENT())
      else if (state.destroyed || state.errored) return false
      else addChunk(stream, state, chunk, true)
    } else if (state.ended) {
      errorOrDestroy(stream, new ERR_STREAM_PUSH_AFTER_EOF())
    } else if (state.destroyed || state.errored) {
      return false
    } else {
      state.state &= ~kReading
      if (state.decoder && !encoding) {
        chunk = state.decoder.write(chunk)
        if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false)
        else maybeReadMore(stream, state)
      } else {
        addChunk(stream, state, chunk, false)
      }
    }
  } else if (!addToFront) {
    state.state &= ~kReading
    maybeReadMore(stream, state)
  }

  // We can push more data if we are below the highWaterMark.
  // Also, if we have no data yet, we can stand some more bytes.
  // This is to work around cases where hwm=0, such as the repl.
  return !state.ended && (state.length < state.highWaterMark || state.length === 0)
}
function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync && stream.listenerCount('data') > 0) {
    // Use the guard to avoid creating `Set()` repeatedly
    // when we have multiple pipes.
    if ((state.state & kMultiAwaitDrain) !== 0) {
      state.awaitDrainWriters.clear()
    } else {
      state.awaitDrainWriters = null
    }
    state.dataEmitted = true
    stream.emit('data', chunk)
  } else {
    // Update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length
    if (addToFront) state.buffer.unshift(chunk)
    else state.buffer.push(chunk)
    if ((state.state & kNeedReadable) !== 0) emitReadable(stream)
  }
  maybeReadMore(stream, state)
}
Readable.prototype.isPaused = function () {
  const state = this._readableState
  return state[kPaused] === true || state.flowing === false
}

// Backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  const decoder = new StringDecoder(enc)
  this._readableState.decoder = decoder
  // If setEncoding(null), decoder.encoding equals utf8.
  this._readableState.encoding = this._readableState.decoder.encoding
  const buffer = this._readableState.buffer
  // Iterate over current buffer to convert already stored Buffers:
  let content = ''
  for (const data of buffer) {
    content += decoder.write(data)
  }
  buffer.clear()
  if (content !== '') buffer.push(content)
  this._readableState.length = content.length
  return this
}

// Don't raise the hwm > 1GB.
const MAX_HWM = 0x40000000
function computeNewHighWaterMark(n) {
  if (n > MAX_HWM) {
    throw new ERR_OUT_OF_RANGE('size', '<= 1GiB', n)
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts.
    n--
    n |= n >>> 1
    n |= n >>> 2
    n |= n >>> 4
    n |= n >>> 8
    n |= n >>> 16
    n++
  }
  return n
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || (state.length === 0 && state.ended)) return 0
  if ((state.state & kObjectMode) !== 0) return 1
  if (NumberIsNaN(n)) {
    // Only flow one buffer at a time.
    if (state.flowing && state.length) return state.buffer.first().length
    return state.length
  }
  if (n <= state.length) return n
  return state.ended ? state.length : 0
}

// You can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n)
  // Same as parseInt(undefined, 10), however V8 7.3 performance regressed
  // in this scenario, so we are doing it manually.
  if (n === undefined) {
    n = NaN
  } else if (!NumberIsInteger(n)) {
    n = NumberParseInt(n, 10)
  }
  const state = this._readableState
  const nOrig = n

  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n)
  if (n !== 0) state.state &= ~kEmittedReadable

  // If we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (
    n === 0 &&
    state.needReadable &&
    ((state.highWaterMark !== 0 ? state.length >= state.highWaterMark : state.length > 0) || state.ended)
  ) {
    debug('read: emitReadable', state.length, state.ended)
    if (state.length === 0 && state.ended) endReadable(this)
    else emitReadable(this)
    return null
  }
  n = howMuchToRead(n, state)

  // If we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this)
    return null
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  let doRead = (state.state & kNeedReadable) !== 0
  debug('need readable', doRead)

  // If we currently have less than the highWaterMark, then also read some.
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true
    debug('length less than watermark', doRead)
  }

  // However, if we've ended, then there's no point, if we're already
  // reading, then it's unnecessary, if we're constructing we have to wait,
  // and if we're destroyed or errored, then it's not allowed,
  if (state.ended || state.reading || state.destroyed || state.errored || !state.constructed) {
    doRead = false
    debug('reading, ended or constructing', doRead)
  } else if (doRead) {
    debug('do read')
    state.state |= kReading | kSync
    // If the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.state |= kNeedReadable

    // Call internal read method
    try {
      this._read(state.highWaterMark)
    } catch (err) {
      errorOrDestroy(this, err)
    }
    state.state &= ~kSync

    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state)
  }
  let ret
  if (n > 0) ret = fromList(n, state)
  else ret = null
  if (ret === null) {
    state.needReadable = state.length <= state.highWaterMark
    n = 0
  } else {
    state.length -= n
    if (state.multiAwaitDrain) {
      state.awaitDrainWriters.clear()
    } else {
      state.awaitDrainWriters = null
    }
  }
  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this)
  }
  if (ret !== null && !state.errorEmitted && !state.closeEmitted) {
    state.dataEmitted = true
    this.emit('data', ret)
  }
  return ret
}
function onEofChunk(stream, state) {
  debug('onEofChunk')
  if (state.ended) return
  if (state.decoder) {
    const chunk = state.decoder.end()
    if (chunk && chunk.length) {
      state.buffer.push(chunk)
      state.length += state.objectMode ? 1 : chunk.length
    }
  }
  state.ended = true
  if (state.sync) {
    // If we are sync, wait until next tick to emit the data.
    // Otherwise we risk emitting data in the flow()
    // the readable code triggers during a read() call.
    emitReadable(stream)
  } else {
    // Emit 'readable' now to make sure it gets picked up.
    state.needReadable = false
    state.emittedReadable = true
    // We have to emit readable now that we are EOF. Modules
    // in the ecosystem (e.g. dicer) rely on this event being sync.
    emitReadable_(stream)
  }
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  const state = stream._readableState
  debug('emitReadable', state.needReadable, state.emittedReadable)
  state.needReadable = false
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing)
    state.emittedReadable = true
    process.nextTick(emitReadable_, stream)
  }
}
function emitReadable_(stream) {
  const state = stream._readableState
  debug('emitReadable_', state.destroyed, state.length, state.ended)
  if (!state.destroyed && !state.errored && (state.length || state.ended)) {
    stream.emit('readable')
    state.emittedReadable = false
  }

  // The stream needs another readable event if:
  // 1. It is not flowing, as the flow mechanism will take
  //    care of it.
  // 2. It is not ended.
  // 3. It is below the highWaterMark, so we can schedule
  //    another readable later.
  state.needReadable = !state.flowing && !state.ended && state.length <= state.highWaterMark
  flow(stream)
}

// At this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore && state.constructed) {
    state.readingMore = true
    process.nextTick(maybeReadMore_, stream, state)
  }
}
function maybeReadMore_(stream, state) {
  // Attempt to read more data if we should.
  //
  // The conditions for reading more data are (one of):
  // - Not enough data buffered (state.length < state.highWaterMark). The loop
  //   is responsible for filling the buffer with enough data if such data
  //   is available. If highWaterMark is 0 and we are not in the flowing mode
  //   we should _not_ attempt to buffer any extra data. We'll get more data
  //   when the stream consumer calls read() instead.
  // - No data in the buffer, and the stream is in flowing mode. In this mode
  //   the loop below is responsible for ensuring read() is called. Failing to
  //   call read here would abort the flow and there's no other mechanism for
  //   continuing the flow if the stream consumer has just subscribed to the
  //   'data' event.
  //
  // In addition to the above conditions to keep reading data, the following
  // conditions prevent the data from being read:
  // - The stream has ended (state.ended).
  // - There is already a pending 'read' operation (state.reading). This is a
  //   case where the stream has called the implementation defined _read()
  //   method, but they are processing the call asynchronously and have _not_
  //   called push() with new data. In this case we skip performing more
  //   read()s. The execution ends in this method again after the _read() ends
  //   up calling push() with more data.
  while (
    !state.reading &&
    !state.ended &&
    (state.length < state.highWaterMark || (state.flowing && state.length === 0))
  ) {
    const len = state.length
    debug('maybeReadMore read 0')
    stream.read(0)
    if (len === state.length)
      // Didn't get any data, stop spinning.
      break
  }
  state.readingMore = false
}

// Abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  throw new ERR_METHOD_NOT_IMPLEMENTED('_read()')
}
Readable.prototype.pipe = function (dest, pipeOpts) {
  const src = this
  const state = this._readableState
  if (state.pipes.length === 1) {
    if (!state.multiAwaitDrain) {
      state.multiAwaitDrain = true
      state.awaitDrainWriters = new SafeSet(state.awaitDrainWriters ? [state.awaitDrainWriters] : [])
    }
  }
  state.pipes.push(dest)
  debug('pipe count=%d opts=%j', state.pipes.length, pipeOpts)
  const doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr
  const endFn = doEnd ? onend : unpipe
  if (state.endEmitted) process.nextTick(endFn)
  else src.once('end', endFn)
  dest.on('unpipe', onunpipe)
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe')
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true
        cleanup()
      }
    }
  }
  function onend() {
    debug('onend')
    dest.end()
  }
  let ondrain
  let cleanedUp = false
  function cleanup() {
    debug('cleanup')
    // Cleanup event handlers once the pipe is broken.
    dest.removeListener('close', onclose)
    dest.removeListener('finish', onfinish)
    if (ondrain) {
      dest.removeListener('drain', ondrain)
    }
    dest.removeListener('error', onerror)
    dest.removeListener('unpipe', onunpipe)
    src.removeListener('end', onend)
    src.removeListener('end', unpipe)
    src.removeListener('data', ondata)
    cleanedUp = true

    // If the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (ondrain && state.awaitDrainWriters && (!dest._writableState || dest._writableState.needDrain)) ondrain()
  }
  function pause() {
    // If the user unpiped during `dest.write()`, it is possible
    // to get stuck in a permanently paused state if that write
    // also returned false.
    // => Check whether `dest` is still a piping destination.
    if (!cleanedUp) {
      if (state.pipes.length === 1 && state.pipes[0] === dest) {
        debug('false write response, pause', 0)
        state.awaitDrainWriters = dest
        state.multiAwaitDrain = false
      } else if (state.pipes.length > 1 && state.pipes.includes(dest)) {
        debug('false write response, pause', state.awaitDrainWriters.size)
        state.awaitDrainWriters.add(dest)
      }
      src.pause()
    }
    if (!ondrain) {
      // When the dest drains, it reduces the awaitDrain counter
      // on the source.  This would be more elegant with a .once()
      // handler in flow(), but adding and removing repeatedly is
      // too slow.
      ondrain = pipeOnDrain(src, dest)
      dest.on('drain', ondrain)
    }
  }
  src.on('data', ondata)
  function ondata(chunk) {
    debug('ondata')
    const ret = dest.write(chunk)
    debug('dest.write', ret)
    if (ret === false) {
      pause()
    }
  }

  // If the dest has an error, then stop piping into it.
  // However, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er)
    unpipe()
    dest.removeListener('error', onerror)
    if (dest.listenerCount('error') === 0) {
      const s = dest._writableState || dest._readableState
      if (s && !s.errorEmitted) {
        // User incorrectly emitted 'error' directly on the stream.
        errorOrDestroy(dest, er)
      } else {
        dest.emit('error', er)
      }
    }
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror)

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish)
    unpipe()
  }
  dest.once('close', onclose)
  function onfinish() {
    debug('onfinish')
    dest.removeListener('close', onclose)
    unpipe()
  }
  dest.once('finish', onfinish)
  function unpipe() {
    debug('unpipe')
    src.unpipe(dest)
  }

  // Tell the dest that it's being piped to.
  dest.emit('pipe', src)

  // Start the flow if it hasn't been started already.

  if (dest.writableNeedDrain === true) {
    pause()
  } else if (!state.flowing) {
    debug('pipe resume')
    src.resume()
  }
  return dest
}
function pipeOnDrain(src, dest) {
  return function pipeOnDrainFunctionResult() {
    const state = src._readableState

    // `ondrain` will call directly,
    // `this` maybe not a reference to dest,
    // so we use the real dest here.
    if (state.awaitDrainWriters === dest) {
      debug('pipeOnDrain', 1)
      state.awaitDrainWriters = null
    } else if (state.multiAwaitDrain) {
      debug('pipeOnDrain', state.awaitDrainWriters.size)
      state.awaitDrainWriters.delete(dest)
    }
    if ((!state.awaitDrainWriters || state.awaitDrainWriters.size === 0) && src.listenerCount('data')) {
      src.resume()
    }
  }
}
Readable.prototype.unpipe = function (dest) {
  const state = this._readableState
  const unpipeInfo = {
    hasUnpiped: false
  }

  // If we're not piping anywhere, then do nothing.
  if (state.pipes.length === 0) return this
  if (!dest) {
    // remove all.
    const dests = state.pipes
    state.pipes = []
    this.pause()
    for (let i = 0; i < dests.length; i++)
      dests[i].emit('unpipe', this, {
        hasUnpiped: false
      })
    return this
  }

  // Try to find the right one.
  const index = ArrayPrototypeIndexOf(state.pipes, dest)
  if (index === -1) return this
  state.pipes.splice(index, 1)
  if (state.pipes.length === 0) this.pause()
  dest.emit('unpipe', this, unpipeInfo)
  return this
}

// Set up data events if they are asked for
// Ensure readable listeners eventually get something.
Readable.prototype.on = function (ev, fn) {
  const res = Stream.prototype.on.call(this, ev, fn)
  const state = this._readableState
  if (ev === 'data') {
    // Update readableListening so that resume() may be a no-op
    // a few lines down. This is needed to support once('readable').
    state.readableListening = this.listenerCount('readable') > 0

    // Try start flowing on next tick if stream isn't explicitly paused.
    if (state.flowing !== false) this.resume()
  } else if (ev === 'readable') {
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true
      state.flowing = false
      state.emittedReadable = false
      debug('on readable', state.length, state.reading)
      if (state.length) {
        emitReadable(this)
      } else if (!state.reading) {
        process.nextTick(nReadingNextTick, this)
      }
    }
  }
  return res
}
Readable.prototype.addListener = Readable.prototype.on
Readable.prototype.removeListener = function (ev, fn) {
  const res = Stream.prototype.removeListener.call(this, ev, fn)
  if (ev === 'readable') {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this)
  }
  return res
}
Readable.prototype.off = Readable.prototype.removeListener
Readable.prototype.removeAllListeners = function (ev) {
  const res = Stream.prototype.removeAllListeners.apply(this, arguments)
  if (ev === 'readable' || ev === undefined) {
    // We need to check if there is someone still listening to
    // readable and reset the state. However this needs to happen
    // after readable has been emitted but before I/O (nextTick) to
    // support once('readable', fn) cycles. This means that calling
    // resume within the same tick will have no
    // effect.
    process.nextTick(updateReadableListening, this)
  }
  return res
}
function updateReadableListening(self) {
  const state = self._readableState
  state.readableListening = self.listenerCount('readable') > 0
  if (state.resumeScheduled && state[kPaused] === false) {
    // Flowing needs to be set to true now, otherwise
    // the upcoming resume will not flow.
    state.flowing = true

    // Crude way to check if we should resume.
  } else if (self.listenerCount('data') > 0) {
    self.resume()
  } else if (!state.readableListening) {
    state.flowing = null
  }
}
function nReadingNextTick(self) {
  debug('readable nexttick read 0')
  self.read(0)
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  const state = this._readableState
  if (!state.flowing) {
    debug('resume')
    // We flow only if there is no one listening
    // for readable, but we still have to call
    // resume().
    state.flowing = !state.readableListening
    resume(this, state)
  }
  state[kPaused] = false
  return this
}
function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true
    process.nextTick(resume_, stream, state)
  }
}
function resume_(stream, state) {
  debug('resume', state.reading)
  if (!state.reading) {
    stream.read(0)
  }
  state.resumeScheduled = false
  stream.emit('resume')
  flow(stream)
  if (state.flowing && !state.reading) stream.read(0)
}
Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing)
  if (this._readableState.flowing !== false) {
    debug('pause')
    this._readableState.flowing = false
    this.emit('pause')
  }
  this._readableState[kPaused] = true
  return this
}
function flow(stream) {
  const state = stream._readableState
  debug('flow', state.flowing)
  while (state.flowing && stream.read() !== null);
}

// Wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  let paused = false

  // TODO (ronag): Should this.destroy(err) emit
  // 'error' on the wrapped stream? Would require
  // a static factory method, e.g. Readable.wrap(stream).

  stream.on('data', (chunk) => {
    if (!this.push(chunk) && stream.pause) {
      paused = true
      stream.pause()
    }
  })
  stream.on('end', () => {
    this.push(null)
  })
  stream.on('error', (err) => {
    errorOrDestroy(this, err)
  })
  stream.on('close', () => {
    this.destroy()
  })
  stream.on('destroy', () => {
    this.destroy()
  })
  this._read = () => {
    if (paused && stream.resume) {
      paused = false
      stream.resume()
    }
  }

  // Proxy all the other methods. Important when wrapping filters and duplexes.
  const streamKeys = ObjectKeys(stream)
  for (let j = 1; j < streamKeys.length; j++) {
    const i = streamKeys[j]
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = stream[i].bind(stream)
    }
  }
  return this
}
Readable.prototype[SymbolAsyncIterator] = function () {
  return streamToAsyncIterator(this)
}
Readable.prototype.iterator = function (options) {
  if (options !== undefined) {
    validateObject(options, 'options')
  }
  return streamToAsyncIterator(this, options)
}
function streamToAsyncIterator(stream, options) {
  if (typeof stream.read !== 'function') {
    stream = Readable.wrap(stream, {
      objectMode: true
    })
  }
  const iter = createAsyncIterator(stream, options)
  iter.stream = stream
  return iter
}
async function* createAsyncIterator(stream, options) {
  let callback = nop
  function next(resolve) {
    if (this === stream) {
      callback()
      callback = nop
    } else {
      callback = resolve
    }
  }
  stream.on('readable', next)
  let error
  const cleanup = eos(
    stream,
    {
      writable: false
    },
    (err) => {
      error = err ? aggregateTwoErrors(error, err) : null
      callback()
      callback = nop
    }
  )
  try {
    while (true) {
      const chunk = stream.destroyed ? null : stream.read()
      if (chunk !== null) {
        yield chunk
      } else if (error) {
        throw error
      } else if (error === null) {
        return
      } else {
        await new Promise(next)
      }
    }
  } catch (err) {
    error = aggregateTwoErrors(error, err)
    throw error
  } finally {
    if (
      (error || (options === null || options === undefined ? undefined : options.destroyOnReturn) !== false) &&
      (error === undefined || stream._readableState.autoDestroy)
    ) {
      destroyImpl.destroyer(stream, null)
    } else {
      stream.off('readable', next)
      cleanup()
    }
  }
}

// Making it explicit these properties are not enumerable
// because otherwise some prototype manipulation in
// userland will fail.
ObjectDefineProperties(Readable.prototype, {
  readable: {
    __proto__: null,
    get() {
      const r = this._readableState
      // r.readable === false means that this is part of a Duplex stream
      // where the readable side was disabled upon construction.
      // Compat. The user might manually disable readable side through
      // deprecated setter.
      return !!r && r.readable !== false && !r.destroyed && !r.errorEmitted && !r.endEmitted
    },
    set(val) {
      // Backwards compat.
      if (this._readableState) {
        this._readableState.readable = !!val
      }
    }
  },
  readableDidRead: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return this._readableState.dataEmitted
    }
  },
  readableAborted: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return !!(
        this._readableState.readable !== false &&
        (this._readableState.destroyed || this._readableState.errored) &&
        !this._readableState.endEmitted
      )
    }
  },
  readableHighWaterMark: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return this._readableState.highWaterMark
    }
  },
  readableBuffer: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return this._readableState && this._readableState.buffer
    }
  },
  readableFlowing: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return this._readableState.flowing
    },
    set: function (state) {
      if (this._readableState) {
        this._readableState.flowing = state
      }
    }
  },
  readableLength: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState.length
    }
  },
  readableObjectMode: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState ? this._readableState.objectMode : false
    }
  },
  readableEncoding: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState ? this._readableState.encoding : null
    }
  },
  errored: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState ? this._readableState.errored : null
    }
  },
  closed: {
    __proto__: null,
    get() {
      return this._readableState ? this._readableState.closed : false
    }
  },
  destroyed: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState ? this._readableState.destroyed : false
    },
    set(value) {
      // We ignore the value if the stream
      // has not been initialized yet.
      if (!this._readableState) {
        return
      }

      // Backward compatibility, the user is explicitly
      // managing destroyed.
      this._readableState.destroyed = value
    }
  },
  readableEnded: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._readableState ? this._readableState.endEmitted : false
    }
  }
})
ObjectDefineProperties(ReadableState.prototype, {
  // Legacy getter for `pipesCount`.
  pipesCount: {
    __proto__: null,
    get() {
      return this.pipes.length
    }
  },
  // Legacy property for `paused`.
  paused: {
    __proto__: null,
    get() {
      return this[kPaused] !== false
    },
    set(value) {
      this[kPaused] = !!value
    }
  }
})

// Exposed for testing purposes only.
Readable._fromList = fromList

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered.
  if (state.length === 0) return null
  let ret
  if (state.objectMode) ret = state.buffer.shift()
  else if (!n || n >= state.length) {
    // Read it all, truncate the list.
    if (state.decoder) ret = state.buffer.join('')
    else if (state.buffer.length === 1) ret = state.buffer.first()
    else ret = state.buffer.concat(state.length)
    state.buffer.clear()
  } else {
    // read part of list.
    ret = state.buffer.consume(n, state.decoder)
  }
  return ret
}
function endReadable(stream) {
  const state = stream._readableState
  debug('endReadable', state.endEmitted)
  if (!state.endEmitted) {
    state.ended = true
    process.nextTick(endReadableNT, state, stream)
  }
}
function endReadableNT(state, stream) {
  debug('endReadableNT', state.endEmitted, state.length)

  // Check that we didn't get one last unshift.
  if (!state.errored && !state.closeEmitted && !state.endEmitted && state.length === 0) {
    state.endEmitted = true
    stream.emit('end')
    if (stream.writable && stream.allowHalfOpen === false) {
      process.nextTick(endWritableNT, stream)
    } else if (state.autoDestroy) {
      // In case of duplex streams we need a way to detect
      // if the writable side is ready for autoDestroy as well.
      const wState = stream._writableState
      const autoDestroy =
        !wState ||
        (wState.autoDestroy &&
          // We don't expect the writable to ever 'finish'
          // if writable is explicitly set to false.
          (wState.finished || wState.writable === false))
      if (autoDestroy) {
        stream.destroy()
      }
    }
  }
}
function endWritableNT(stream) {
  const writable = stream.writable && !stream.writableEnded && !stream.destroyed
  if (writable) {
    stream.end()
  }
}
Readable.from = function (iterable, opts) {
  return from(Readable, iterable, opts)
}
let webStreamsAdapters

// Lazy to avoid circular references
function lazyWebStreams() {
  if (webStreamsAdapters === undefined) webStreamsAdapters = {}
  return webStreamsAdapters
}
Readable.fromWeb = function (readableStream, options) {
  return lazyWebStreams().newStreamReadableFromReadableStream(readableStream, options)
}
Readable.toWeb = function (streamReadable, options) {
  return lazyWebStreams().newReadableStreamFromStreamReadable(streamReadable, options)
}
Readable.wrap = function (src, options) {
  var _ref, _src$readableObjectMo
  return new Readable({
    objectMode:
      (_ref =
        (_src$readableObjectMo = src.readableObjectMode) !== null && _src$readableObjectMo !== undefined
          ? _src$readableObjectMo
          : src.objectMode) !== null && _ref !== undefined
        ? _ref
        : true,
    ...options,
    destroy(err, callback) {
      destroyImpl.destroyer(src, err)
      callback(err)
    }
  }).wrap(src)
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../../ours/util":28,"../validators":24,"./add-abort-signal":7,"./buffer_list":8,"./destroy":10,"./duplex":11,"./end-of-stream":13,"./from":14,"./legacy":15,"./state":20,"buffer":3,"events":4,"process/":31,"string_decoder":33}],20:[function(require,module,exports){
'use strict'

const { MathFloor, NumberIsInteger } = require('../../ours/primordials')
const { validateInteger } = require('../validators')
const { ERR_INVALID_ARG_VALUE } = require('../../ours/errors').codes
let defaultHighWaterMarkBytes = 16 * 1024
let defaultHighWaterMarkObjectMode = 16
function highWaterMarkFrom(options, isDuplex, duplexKey) {
  return options.highWaterMark != null ? options.highWaterMark : isDuplex ? options[duplexKey] : null
}
function getDefaultHighWaterMark(objectMode) {
  return objectMode ? defaultHighWaterMarkObjectMode : defaultHighWaterMarkBytes
}
function setDefaultHighWaterMark(objectMode, value) {
  validateInteger(value, 'value', 0)
  if (objectMode) {
    defaultHighWaterMarkObjectMode = value
  } else {
    defaultHighWaterMarkBytes = value
  }
}
function getHighWaterMark(state, options, duplexKey, isDuplex) {
  const hwm = highWaterMarkFrom(options, isDuplex, duplexKey)
  if (hwm != null) {
    if (!NumberIsInteger(hwm) || hwm < 0) {
      const name = isDuplex ? `options.${duplexKey}` : 'options.highWaterMark'
      throw new ERR_INVALID_ARG_VALUE(name, hwm)
    }
    return MathFloor(hwm)
  }

  // Default value
  return getDefaultHighWaterMark(state.objectMode)
}
module.exports = {
  getHighWaterMark,
  getDefaultHighWaterMark,
  setDefaultHighWaterMark
}

},{"../../ours/errors":26,"../../ours/primordials":27,"../validators":24}],21:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict'

const { ObjectSetPrototypeOf, Symbol } = require('../../ours/primordials')
module.exports = Transform
const { ERR_METHOD_NOT_IMPLEMENTED } = require('../../ours/errors').codes
const Duplex = require('./duplex')
const { getHighWaterMark } = require('./state')
ObjectSetPrototypeOf(Transform.prototype, Duplex.prototype)
ObjectSetPrototypeOf(Transform, Duplex)
const kCallback = Symbol('kCallback')
function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options)

  // TODO (ronag): This should preferably always be
  // applied but would be semver-major. Or even better;
  // make Transform a Readable with the Writable interface.
  const readableHighWaterMark = options ? getHighWaterMark(this, options, 'readableHighWaterMark', true) : null
  if (readableHighWaterMark === 0) {
    // A Duplex will buffer both on the writable and readable side while
    // a Transform just wants to buffer hwm number of elements. To avoid
    // buffering twice we disable buffering on the writable side.
    options = {
      ...options,
      highWaterMark: null,
      readableHighWaterMark,
      // TODO (ronag): 0 is not optimal since we have
      // a "bug" where we check needDrain before calling _write and not after.
      // Refs: https://github.com/nodejs/node/pull/32887
      // Refs: https://github.com/nodejs/node/pull/35941
      writableHighWaterMark: options.writableHighWaterMark || 0
    }
  }
  Duplex.call(this, options)

  // We have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false
  this[kCallback] = null
  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform
    if (typeof options.flush === 'function') this._flush = options.flush
  }

  // When the writable side finishes, then flush out anything remaining.
  // Backwards compat. Some Transform streams incorrectly implement _final
  // instead of or in addition to _flush. By using 'prefinish' instead of
  // implementing _final we continue supporting this unfortunate use case.
  this.on('prefinish', prefinish)
}
function final(cb) {
  if (typeof this._flush === 'function' && !this.destroyed) {
    this._flush((er, data) => {
      if (er) {
        if (cb) {
          cb(er)
        } else {
          this.destroy(er)
        }
        return
      }
      if (data != null) {
        this.push(data)
      }
      this.push(null)
      if (cb) {
        cb()
      }
    })
  } else {
    this.push(null)
    if (cb) {
      cb()
    }
  }
}
function prefinish() {
  if (this._final !== final) {
    final.call(this)
  }
}
Transform.prototype._final = final
Transform.prototype._transform = function (chunk, encoding, callback) {
  throw new ERR_METHOD_NOT_IMPLEMENTED('_transform()')
}
Transform.prototype._write = function (chunk, encoding, callback) {
  const rState = this._readableState
  const wState = this._writableState
  const length = rState.length
  this._transform(chunk, encoding, (err, val) => {
    if (err) {
      callback(err)
      return
    }
    if (val != null) {
      this.push(val)
    }
    if (
      wState.ended ||
      // Backwards compat.
      length === rState.length ||
      // Backwards compat.
      rState.length < rState.highWaterMark
    ) {
      callback()
    } else {
      this[kCallback] = callback
    }
  })
}
Transform.prototype._read = function () {
  if (this[kCallback]) {
    const callback = this[kCallback]
    this[kCallback] = null
    callback()
  }
}

},{"../../ours/errors":26,"../../ours/primordials":27,"./duplex":11,"./state":20}],22:[function(require,module,exports){
'use strict'

const { SymbolAsyncIterator, SymbolIterator, SymbolFor } = require('../../ours/primordials')

// We need to use SymbolFor to make these globally available
// for interopt with readable-stream, i.e. readable-stream
// and node core needs to be able to read/write private state
// from each other for proper interoperability.
const kIsDestroyed = SymbolFor('nodejs.stream.destroyed')
const kIsErrored = SymbolFor('nodejs.stream.errored')
const kIsReadable = SymbolFor('nodejs.stream.readable')
const kIsWritable = SymbolFor('nodejs.stream.writable')
const kIsDisturbed = SymbolFor('nodejs.stream.disturbed')
const kIsClosedPromise = SymbolFor('nodejs.webstream.isClosedPromise')
const kControllerErrorFunction = SymbolFor('nodejs.webstream.controllerErrorFunction')
function isReadableNodeStream(obj, strict = false) {
  var _obj$_readableState
  return !!(
    (
      obj &&
      typeof obj.pipe === 'function' &&
      typeof obj.on === 'function' &&
      (!strict || (typeof obj.pause === 'function' && typeof obj.resume === 'function')) &&
      (!obj._writableState ||
        ((_obj$_readableState = obj._readableState) === null || _obj$_readableState === undefined
          ? undefined
          : _obj$_readableState.readable) !== false) &&
      // Duplex
      (!obj._writableState || obj._readableState)
    ) // Writable has .pipe.
  )
}

function isWritableNodeStream(obj) {
  var _obj$_writableState
  return !!(
    (
      obj &&
      typeof obj.write === 'function' &&
      typeof obj.on === 'function' &&
      (!obj._readableState ||
        ((_obj$_writableState = obj._writableState) === null || _obj$_writableState === undefined
          ? undefined
          : _obj$_writableState.writable) !== false)
    ) // Duplex
  )
}

function isDuplexNodeStream(obj) {
  return !!(
    obj &&
    typeof obj.pipe === 'function' &&
    obj._readableState &&
    typeof obj.on === 'function' &&
    typeof obj.write === 'function'
  )
}
function isNodeStream(obj) {
  return (
    obj &&
    (obj._readableState ||
      obj._writableState ||
      (typeof obj.write === 'function' && typeof obj.on === 'function') ||
      (typeof obj.pipe === 'function' && typeof obj.on === 'function'))
  )
}
function isReadableStream(obj) {
  return !!(
    obj &&
    !isNodeStream(obj) &&
    typeof obj.pipeThrough === 'function' &&
    typeof obj.getReader === 'function' &&
    typeof obj.cancel === 'function'
  )
}
function isWritableStream(obj) {
  return !!(obj && !isNodeStream(obj) && typeof obj.getWriter === 'function' && typeof obj.abort === 'function')
}
function isTransformStream(obj) {
  return !!(obj && !isNodeStream(obj) && typeof obj.readable === 'object' && typeof obj.writable === 'object')
}
function isWebStream(obj) {
  return isReadableStream(obj) || isWritableStream(obj) || isTransformStream(obj)
}
function isIterable(obj, isAsync) {
  if (obj == null) return false
  if (isAsync === true) return typeof obj[SymbolAsyncIterator] === 'function'
  if (isAsync === false) return typeof obj[SymbolIterator] === 'function'
  return typeof obj[SymbolAsyncIterator] === 'function' || typeof obj[SymbolIterator] === 'function'
}
function isDestroyed(stream) {
  if (!isNodeStream(stream)) return null
  const wState = stream._writableState
  const rState = stream._readableState
  const state = wState || rState
  return !!(stream.destroyed || stream[kIsDestroyed] || (state !== null && state !== undefined && state.destroyed))
}

// Have been end():d.
function isWritableEnded(stream) {
  if (!isWritableNodeStream(stream)) return null
  if (stream.writableEnded === true) return true
  const wState = stream._writableState
  if (wState !== null && wState !== undefined && wState.errored) return false
  if (typeof (wState === null || wState === undefined ? undefined : wState.ended) !== 'boolean') return null
  return wState.ended
}

// Have emitted 'finish'.
function isWritableFinished(stream, strict) {
  if (!isWritableNodeStream(stream)) return null
  if (stream.writableFinished === true) return true
  const wState = stream._writableState
  if (wState !== null && wState !== undefined && wState.errored) return false
  if (typeof (wState === null || wState === undefined ? undefined : wState.finished) !== 'boolean') return null
  return !!(wState.finished || (strict === false && wState.ended === true && wState.length === 0))
}

// Have been push(null):d.
function isReadableEnded(stream) {
  if (!isReadableNodeStream(stream)) return null
  if (stream.readableEnded === true) return true
  const rState = stream._readableState
  if (!rState || rState.errored) return false
  if (typeof (rState === null || rState === undefined ? undefined : rState.ended) !== 'boolean') return null
  return rState.ended
}

// Have emitted 'end'.
function isReadableFinished(stream, strict) {
  if (!isReadableNodeStream(stream)) return null
  const rState = stream._readableState
  if (rState !== null && rState !== undefined && rState.errored) return false
  if (typeof (rState === null || rState === undefined ? undefined : rState.endEmitted) !== 'boolean') return null
  return !!(rState.endEmitted || (strict === false && rState.ended === true && rState.length === 0))
}
function isReadable(stream) {
  if (stream && stream[kIsReadable] != null) return stream[kIsReadable]
  if (typeof (stream === null || stream === undefined ? undefined : stream.readable) !== 'boolean') return null
  if (isDestroyed(stream)) return false
  return isReadableNodeStream(stream) && stream.readable && !isReadableFinished(stream)
}
function isWritable(stream) {
  if (stream && stream[kIsWritable] != null) return stream[kIsWritable]
  if (typeof (stream === null || stream === undefined ? undefined : stream.writable) !== 'boolean') return null
  if (isDestroyed(stream)) return false
  return isWritableNodeStream(stream) && stream.writable && !isWritableEnded(stream)
}
function isFinished(stream, opts) {
  if (!isNodeStream(stream)) {
    return null
  }
  if (isDestroyed(stream)) {
    return true
  }
  if ((opts === null || opts === undefined ? undefined : opts.readable) !== false && isReadable(stream)) {
    return false
  }
  if ((opts === null || opts === undefined ? undefined : opts.writable) !== false && isWritable(stream)) {
    return false
  }
  return true
}
function isWritableErrored(stream) {
  var _stream$_writableStat, _stream$_writableStat2
  if (!isNodeStream(stream)) {
    return null
  }
  if (stream.writableErrored) {
    return stream.writableErrored
  }
  return (_stream$_writableStat =
    (_stream$_writableStat2 = stream._writableState) === null || _stream$_writableStat2 === undefined
      ? undefined
      : _stream$_writableStat2.errored) !== null && _stream$_writableStat !== undefined
    ? _stream$_writableStat
    : null
}
function isReadableErrored(stream) {
  var _stream$_readableStat, _stream$_readableStat2
  if (!isNodeStream(stream)) {
    return null
  }
  if (stream.readableErrored) {
    return stream.readableErrored
  }
  return (_stream$_readableStat =
    (_stream$_readableStat2 = stream._readableState) === null || _stream$_readableStat2 === undefined
      ? undefined
      : _stream$_readableStat2.errored) !== null && _stream$_readableStat !== undefined
    ? _stream$_readableStat
    : null
}
function isClosed(stream) {
  if (!isNodeStream(stream)) {
    return null
  }
  if (typeof stream.closed === 'boolean') {
    return stream.closed
  }
  const wState = stream._writableState
  const rState = stream._readableState
  if (
    typeof (wState === null || wState === undefined ? undefined : wState.closed) === 'boolean' ||
    typeof (rState === null || rState === undefined ? undefined : rState.closed) === 'boolean'
  ) {
    return (
      (wState === null || wState === undefined ? undefined : wState.closed) ||
      (rState === null || rState === undefined ? undefined : rState.closed)
    )
  }
  if (typeof stream._closed === 'boolean' && isOutgoingMessage(stream)) {
    return stream._closed
  }
  return null
}
function isOutgoingMessage(stream) {
  return (
    typeof stream._closed === 'boolean' &&
    typeof stream._defaultKeepAlive === 'boolean' &&
    typeof stream._removedConnection === 'boolean' &&
    typeof stream._removedContLen === 'boolean'
  )
}
function isServerResponse(stream) {
  return typeof stream._sent100 === 'boolean' && isOutgoingMessage(stream)
}
function isServerRequest(stream) {
  var _stream$req
  return (
    typeof stream._consuming === 'boolean' &&
    typeof stream._dumped === 'boolean' &&
    ((_stream$req = stream.req) === null || _stream$req === undefined ? undefined : _stream$req.upgradeOrConnect) ===
      undefined
  )
}
function willEmitClose(stream) {
  if (!isNodeStream(stream)) return null
  const wState = stream._writableState
  const rState = stream._readableState
  const state = wState || rState
  return (
    (!state && isServerResponse(stream)) || !!(state && state.autoDestroy && state.emitClose && state.closed === false)
  )
}
function isDisturbed(stream) {
  var _stream$kIsDisturbed
  return !!(
    stream &&
    ((_stream$kIsDisturbed = stream[kIsDisturbed]) !== null && _stream$kIsDisturbed !== undefined
      ? _stream$kIsDisturbed
      : stream.readableDidRead || stream.readableAborted)
  )
}
function isErrored(stream) {
  var _ref,
    _ref2,
    _ref3,
    _ref4,
    _ref5,
    _stream$kIsErrored,
    _stream$_readableStat3,
    _stream$_writableStat3,
    _stream$_readableStat4,
    _stream$_writableStat4
  return !!(
    stream &&
    ((_ref =
      (_ref2 =
        (_ref3 =
          (_ref4 =
            (_ref5 =
              (_stream$kIsErrored = stream[kIsErrored]) !== null && _stream$kIsErrored !== undefined
                ? _stream$kIsErrored
                : stream.readableErrored) !== null && _ref5 !== undefined
              ? _ref5
              : stream.writableErrored) !== null && _ref4 !== undefined
            ? _ref4
            : (_stream$_readableStat3 = stream._readableState) === null || _stream$_readableStat3 === undefined
            ? undefined
            : _stream$_readableStat3.errorEmitted) !== null && _ref3 !== undefined
          ? _ref3
          : (_stream$_writableStat3 = stream._writableState) === null || _stream$_writableStat3 === undefined
          ? undefined
          : _stream$_writableStat3.errorEmitted) !== null && _ref2 !== undefined
        ? _ref2
        : (_stream$_readableStat4 = stream._readableState) === null || _stream$_readableStat4 === undefined
        ? undefined
        : _stream$_readableStat4.errored) !== null && _ref !== undefined
      ? _ref
      : (_stream$_writableStat4 = stream._writableState) === null || _stream$_writableStat4 === undefined
      ? undefined
      : _stream$_writableStat4.errored)
  )
}
module.exports = {
  isDestroyed,
  kIsDestroyed,
  isDisturbed,
  kIsDisturbed,
  isErrored,
  kIsErrored,
  isReadable,
  kIsReadable,
  kIsClosedPromise,
  kControllerErrorFunction,
  kIsWritable,
  isClosed,
  isDuplexNodeStream,
  isFinished,
  isIterable,
  isReadableNodeStream,
  isReadableStream,
  isReadableEnded,
  isReadableFinished,
  isReadableErrored,
  isNodeStream,
  isWebStream,
  isWritable,
  isWritableNodeStream,
  isWritableStream,
  isWritableEnded,
  isWritableFinished,
  isWritableErrored,
  isServerRequest,
  isServerResponse,
  willEmitClose,
  isTransformStream
}

},{"../../ours/primordials":27}],23:[function(require,module,exports){
/* replacement start */

const process = require('process/')

/* replacement end */
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

;('use strict')
const {
  ArrayPrototypeSlice,
  Error,
  FunctionPrototypeSymbolHasInstance,
  ObjectDefineProperty,
  ObjectDefineProperties,
  ObjectSetPrototypeOf,
  StringPrototypeToLowerCase,
  Symbol,
  SymbolHasInstance
} = require('../../ours/primordials')
module.exports = Writable
Writable.WritableState = WritableState
const { EventEmitter: EE } = require('events')
const Stream = require('./legacy').Stream
const { Buffer } = require('buffer')
const destroyImpl = require('./destroy')
const { addAbortSignal } = require('./add-abort-signal')
const { getHighWaterMark, getDefaultHighWaterMark } = require('./state')
const {
  ERR_INVALID_ARG_TYPE,
  ERR_METHOD_NOT_IMPLEMENTED,
  ERR_MULTIPLE_CALLBACK,
  ERR_STREAM_CANNOT_PIPE,
  ERR_STREAM_DESTROYED,
  ERR_STREAM_ALREADY_FINISHED,
  ERR_STREAM_NULL_VALUES,
  ERR_STREAM_WRITE_AFTER_END,
  ERR_UNKNOWN_ENCODING
} = require('../../ours/errors').codes
const { errorOrDestroy } = destroyImpl
ObjectSetPrototypeOf(Writable.prototype, Stream.prototype)
ObjectSetPrototypeOf(Writable, Stream)
function nop() {}
const kOnFinished = Symbol('kOnFinished')
function WritableState(options, stream, isDuplex) {
  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream,
  // e.g. options.readableObjectMode vs. options.writableObjectMode, etc.
  if (typeof isDuplex !== 'boolean') isDuplex = stream instanceof require('./duplex')

  // Object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!(options && options.objectMode)
  if (isDuplex) this.objectMode = this.objectMode || !!(options && options.writableObjectMode)

  // The point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write().
  this.highWaterMark = options
    ? getHighWaterMark(this, options, 'writableHighWaterMark', isDuplex)
    : getDefaultHighWaterMark(false)

  // if _final has been called.
  this.finalCalled = false

  // drain event flag.
  this.needDrain = false
  // At the start of calling end()
  this.ending = false
  // When end() has been called, and returned.
  this.ended = false
  // When 'finish' is emitted.
  this.finished = false

  // Has it been destroyed
  this.destroyed = false

  // Should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  const noDecode = !!(options && options.decodeStrings === false)
  this.decodeStrings = !noDecode

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = (options && options.defaultEncoding) || 'utf8'

  // Not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0

  // A flag to see when we're in the middle of a write.
  this.writing = false

  // When true all writes will be buffered until .uncork() call.
  this.corked = 0

  // A flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true

  // A flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false

  // The callback that's passed to _write(chunk, cb).
  this.onwrite = onwrite.bind(undefined, stream)

  // The callback that the user supplies to write(chunk, encoding, cb).
  this.writecb = null

  // The amount that is being written when _write is called.
  this.writelen = 0

  // Storage for data passed to the afterWrite() callback in case of
  // synchronous _write() completion.
  this.afterWriteTickInfo = null
  resetBuffer(this)

  // Number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted.
  this.pendingcb = 0

  // Stream is still being constructed and cannot be
  // destroyed until construction finished or failed.
  // Async construction is opt in, therefore we start as
  // constructed.
  this.constructed = true

  // Emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams.
  this.prefinished = false

  // True if the error was already emitted and should not be thrown again.
  this.errorEmitted = false

  // Should close be emitted on destroy. Defaults to true.
  this.emitClose = !options || options.emitClose !== false

  // Should .destroy() be called after 'finish' (and potentially 'end').
  this.autoDestroy = !options || options.autoDestroy !== false

  // Indicates whether the stream has errored. When true all write() calls
  // should return false. This is needed since when autoDestroy
  // is disabled we need a way to tell whether the stream has failed.
  this.errored = null

  // Indicates whether the stream has finished destroying.
  this.closed = false

  // True if close has been emitted or would have been emitted
  // depending on emitClose.
  this.closeEmitted = false
  this[kOnFinished] = []
}
function resetBuffer(state) {
  state.buffered = []
  state.bufferedIndex = 0
  state.allBuffers = true
  state.allNoop = true
}
WritableState.prototype.getBuffer = function getBuffer() {
  return ArrayPrototypeSlice(this.buffered, this.bufferedIndex)
}
ObjectDefineProperty(WritableState.prototype, 'bufferedRequestCount', {
  __proto__: null,
  get() {
    return this.buffered.length - this.bufferedIndex
  }
})
function Writable(options) {
  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.

  // Checking for a Stream.Duplex instance is faster here instead of inside
  // the WritableState constructor, at least with V8 6.5.
  const isDuplex = this instanceof require('./duplex')
  if (!isDuplex && !FunctionPrototypeSymbolHasInstance(Writable, this)) return new Writable(options)
  this._writableState = new WritableState(options, this, isDuplex)
  if (options) {
    if (typeof options.write === 'function') this._write = options.write
    if (typeof options.writev === 'function') this._writev = options.writev
    if (typeof options.destroy === 'function') this._destroy = options.destroy
    if (typeof options.final === 'function') this._final = options.final
    if (typeof options.construct === 'function') this._construct = options.construct
    if (options.signal) addAbortSignal(options.signal, this)
  }
  Stream.call(this, options)
  destroyImpl.construct(this, () => {
    const state = this._writableState
    if (!state.writing) {
      clearBuffer(this, state)
    }
    finishMaybe(this, state)
  })
}
ObjectDefineProperty(Writable, SymbolHasInstance, {
  __proto__: null,
  value: function (object) {
    if (FunctionPrototypeSymbolHasInstance(this, object)) return true
    if (this !== Writable) return false
    return object && object._writableState instanceof WritableState
  }
})

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  errorOrDestroy(this, new ERR_STREAM_CANNOT_PIPE())
}
function _write(stream, chunk, encoding, cb) {
  const state = stream._writableState
  if (typeof encoding === 'function') {
    cb = encoding
    encoding = state.defaultEncoding
  } else {
    if (!encoding) encoding = state.defaultEncoding
    else if (encoding !== 'buffer' && !Buffer.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding)
    if (typeof cb !== 'function') cb = nop
  }
  if (chunk === null) {
    throw new ERR_STREAM_NULL_VALUES()
  } else if (!state.objectMode) {
    if (typeof chunk === 'string') {
      if (state.decodeStrings !== false) {
        chunk = Buffer.from(chunk, encoding)
        encoding = 'buffer'
      }
    } else if (chunk instanceof Buffer) {
      encoding = 'buffer'
    } else if (Stream._isUint8Array(chunk)) {
      chunk = Stream._uint8ArrayToBuffer(chunk)
      encoding = 'buffer'
    } else {
      throw new ERR_INVALID_ARG_TYPE('chunk', ['string', 'Buffer', 'Uint8Array'], chunk)
    }
  }
  let err
  if (state.ending) {
    err = new ERR_STREAM_WRITE_AFTER_END()
  } else if (state.destroyed) {
    err = new ERR_STREAM_DESTROYED('write')
  }
  if (err) {
    process.nextTick(cb, err)
    errorOrDestroy(stream, err, true)
    return err
  }
  state.pendingcb++
  return writeOrBuffer(stream, state, chunk, encoding, cb)
}
Writable.prototype.write = function (chunk, encoding, cb) {
  return _write(this, chunk, encoding, cb) === true
}
Writable.prototype.cork = function () {
  this._writableState.corked++
}
Writable.prototype.uncork = function () {
  const state = this._writableState
  if (state.corked) {
    state.corked--
    if (!state.writing) clearBuffer(this, state)
  }
}
Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = StringPrototypeToLowerCase(encoding)
  if (!Buffer.isEncoding(encoding)) throw new ERR_UNKNOWN_ENCODING(encoding)
  this._writableState.defaultEncoding = encoding
  return this
}

// If we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, callback) {
  const len = state.objectMode ? 1 : chunk.length
  state.length += len

  // stream._write resets state.length
  const ret = state.length < state.highWaterMark
  // We must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true
  if (state.writing || state.corked || state.errored || !state.constructed) {
    state.buffered.push({
      chunk,
      encoding,
      callback
    })
    if (state.allBuffers && encoding !== 'buffer') {
      state.allBuffers = false
    }
    if (state.allNoop && callback !== nop) {
      state.allNoop = false
    }
  } else {
    state.writelen = len
    state.writecb = callback
    state.writing = true
    state.sync = true
    stream._write(chunk, encoding, state.onwrite)
    state.sync = false
  }

  // Return false if errored or destroyed in order to break
  // any synchronous while(stream.write(data)) loops.
  return ret && !state.errored && !state.destroyed
}
function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len
  state.writecb = cb
  state.writing = true
  state.sync = true
  if (state.destroyed) state.onwrite(new ERR_STREAM_DESTROYED('write'))
  else if (writev) stream._writev(chunk, state.onwrite)
  else stream._write(chunk, encoding, state.onwrite)
  state.sync = false
}
function onwriteError(stream, state, er, cb) {
  --state.pendingcb
  cb(er)
  // Ensure callbacks are invoked even when autoDestroy is
  // not enabled. Passing `er` here doesn't make sense since
  // it's related to one specific write, not to the buffered
  // writes.
  errorBuffer(state)
  // This can emit error, but error must always follow cb.
  errorOrDestroy(stream, er)
}
function onwrite(stream, er) {
  const state = stream._writableState
  const sync = state.sync
  const cb = state.writecb
  if (typeof cb !== 'function') {
    errorOrDestroy(stream, new ERR_MULTIPLE_CALLBACK())
    return
  }
  state.writing = false
  state.writecb = null
  state.length -= state.writelen
  state.writelen = 0
  if (er) {
    // Avoid V8 leak, https://github.com/nodejs/node/pull/34103#issuecomment-652002364
    er.stack // eslint-disable-line no-unused-expressions

    if (!state.errored) {
      state.errored = er
    }

    // In case of duplex streams we need to notify the readable side of the
    // error.
    if (stream._readableState && !stream._readableState.errored) {
      stream._readableState.errored = er
    }
    if (sync) {
      process.nextTick(onwriteError, stream, state, er, cb)
    } else {
      onwriteError(stream, state, er, cb)
    }
  } else {
    if (state.buffered.length > state.bufferedIndex) {
      clearBuffer(stream, state)
    }
    if (sync) {
      // It is a common case that the callback passed to .write() is always
      // the same. In that case, we do not schedule a new nextTick(), but
      // rather just increase a counter, to improve performance and avoid
      // memory allocations.
      if (state.afterWriteTickInfo !== null && state.afterWriteTickInfo.cb === cb) {
        state.afterWriteTickInfo.count++
      } else {
        state.afterWriteTickInfo = {
          count: 1,
          cb,
          stream,
          state
        }
        process.nextTick(afterWriteTick, state.afterWriteTickInfo)
      }
    } else {
      afterWrite(stream, state, 1, cb)
    }
  }
}
function afterWriteTick({ stream, state, count, cb }) {
  state.afterWriteTickInfo = null
  return afterWrite(stream, state, count, cb)
}
function afterWrite(stream, state, count, cb) {
  const needDrain = !state.ending && !stream.destroyed && state.length === 0 && state.needDrain
  if (needDrain) {
    state.needDrain = false
    stream.emit('drain')
  }
  while (count-- > 0) {
    state.pendingcb--
    cb()
  }
  if (state.destroyed) {
    errorBuffer(state)
  }
  finishMaybe(stream, state)
}

// If there's something in the buffer waiting, then invoke callbacks.
function errorBuffer(state) {
  if (state.writing) {
    return
  }
  for (let n = state.bufferedIndex; n < state.buffered.length; ++n) {
    var _state$errored
    const { chunk, callback } = state.buffered[n]
    const len = state.objectMode ? 1 : chunk.length
    state.length -= len
    callback(
      (_state$errored = state.errored) !== null && _state$errored !== undefined
        ? _state$errored
        : new ERR_STREAM_DESTROYED('write')
    )
  }
  const onfinishCallbacks = state[kOnFinished].splice(0)
  for (let i = 0; i < onfinishCallbacks.length; i++) {
    var _state$errored2
    onfinishCallbacks[i](
      (_state$errored2 = state.errored) !== null && _state$errored2 !== undefined
        ? _state$errored2
        : new ERR_STREAM_DESTROYED('end')
    )
  }
  resetBuffer(state)
}

// If there's something in the buffer waiting, then process it.
function clearBuffer(stream, state) {
  if (state.corked || state.bufferProcessing || state.destroyed || !state.constructed) {
    return
  }
  const { buffered, bufferedIndex, objectMode } = state
  const bufferedLength = buffered.length - bufferedIndex
  if (!bufferedLength) {
    return
  }
  let i = bufferedIndex
  state.bufferProcessing = true
  if (bufferedLength > 1 && stream._writev) {
    state.pendingcb -= bufferedLength - 1
    const callback = state.allNoop
      ? nop
      : (err) => {
          for (let n = i; n < buffered.length; ++n) {
            buffered[n].callback(err)
          }
        }
    // Make a copy of `buffered` if it's going to be used by `callback` above,
    // since `doWrite` will mutate the array.
    const chunks = state.allNoop && i === 0 ? buffered : ArrayPrototypeSlice(buffered, i)
    chunks.allBuffers = state.allBuffers
    doWrite(stream, state, true, state.length, chunks, '', callback)
    resetBuffer(state)
  } else {
    do {
      const { chunk, encoding, callback } = buffered[i]
      buffered[i++] = null
      const len = objectMode ? 1 : chunk.length
      doWrite(stream, state, false, len, chunk, encoding, callback)
    } while (i < buffered.length && !state.writing)
    if (i === buffered.length) {
      resetBuffer(state)
    } else if (i > 256) {
      buffered.splice(0, i)
      state.bufferedIndex = 0
    } else {
      state.bufferedIndex = i
    }
  }
  state.bufferProcessing = false
}
Writable.prototype._write = function (chunk, encoding, cb) {
  if (this._writev) {
    this._writev(
      [
        {
          chunk,
          encoding
        }
      ],
      cb
    )
  } else {
    throw new ERR_METHOD_NOT_IMPLEMENTED('_write()')
  }
}
Writable.prototype._writev = null
Writable.prototype.end = function (chunk, encoding, cb) {
  const state = this._writableState
  if (typeof chunk === 'function') {
    cb = chunk
    chunk = null
    encoding = null
  } else if (typeof encoding === 'function') {
    cb = encoding
    encoding = null
  }
  let err
  if (chunk !== null && chunk !== undefined) {
    const ret = _write(this, chunk, encoding)
    if (ret instanceof Error) {
      err = ret
    }
  }

  // .end() fully uncorks.
  if (state.corked) {
    state.corked = 1
    this.uncork()
  }
  if (err) {
    // Do nothing...
  } else if (!state.errored && !state.ending) {
    // This is forgiving in terms of unnecessary calls to end() and can hide
    // logic errors. However, usually such errors are harmless and causing a
    // hard error can be disproportionately destructive. It is not always
    // trivial for the user to determine whether end() needs to be called
    // or not.

    state.ending = true
    finishMaybe(this, state, true)
    state.ended = true
  } else if (state.finished) {
    err = new ERR_STREAM_ALREADY_FINISHED('end')
  } else if (state.destroyed) {
    err = new ERR_STREAM_DESTROYED('end')
  }
  if (typeof cb === 'function') {
    if (err || state.finished) {
      process.nextTick(cb, err)
    } else {
      state[kOnFinished].push(cb)
    }
  }
  return this
}
function needFinish(state) {
  return (
    state.ending &&
    !state.destroyed &&
    state.constructed &&
    state.length === 0 &&
    !state.errored &&
    state.buffered.length === 0 &&
    !state.finished &&
    !state.writing &&
    !state.errorEmitted &&
    !state.closeEmitted
  )
}
function callFinal(stream, state) {
  let called = false
  function onFinish(err) {
    if (called) {
      errorOrDestroy(stream, err !== null && err !== undefined ? err : ERR_MULTIPLE_CALLBACK())
      return
    }
    called = true
    state.pendingcb--
    if (err) {
      const onfinishCallbacks = state[kOnFinished].splice(0)
      for (let i = 0; i < onfinishCallbacks.length; i++) {
        onfinishCallbacks[i](err)
      }
      errorOrDestroy(stream, err, state.sync)
    } else if (needFinish(state)) {
      state.prefinished = true
      stream.emit('prefinish')
      // Backwards compat. Don't check state.sync here.
      // Some streams assume 'finish' will be emitted
      // asynchronously relative to _final callback.
      state.pendingcb++
      process.nextTick(finish, stream, state)
    }
  }
  state.sync = true
  state.pendingcb++
  try {
    stream._final(onFinish)
  } catch (err) {
    onFinish(err)
  }
  state.sync = false
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function' && !state.destroyed) {
      state.finalCalled = true
      callFinal(stream, state)
    } else {
      state.prefinished = true
      stream.emit('prefinish')
    }
  }
}
function finishMaybe(stream, state, sync) {
  if (needFinish(state)) {
    prefinish(stream, state)
    if (state.pendingcb === 0) {
      if (sync) {
        state.pendingcb++
        process.nextTick(
          (stream, state) => {
            if (needFinish(state)) {
              finish(stream, state)
            } else {
              state.pendingcb--
            }
          },
          stream,
          state
        )
      } else if (needFinish(state)) {
        state.pendingcb++
        finish(stream, state)
      }
    }
  }
}
function finish(stream, state) {
  state.pendingcb--
  state.finished = true
  const onfinishCallbacks = state[kOnFinished].splice(0)
  for (let i = 0; i < onfinishCallbacks.length; i++) {
    onfinishCallbacks[i]()
  }
  stream.emit('finish')
  if (state.autoDestroy) {
    // In case of duplex streams we need a way to detect
    // if the readable side is ready for autoDestroy as well.
    const rState = stream._readableState
    const autoDestroy =
      !rState ||
      (rState.autoDestroy &&
        // We don't expect the readable to ever 'end'
        // if readable is explicitly set to false.
        (rState.endEmitted || rState.readable === false))
    if (autoDestroy) {
      stream.destroy()
    }
  }
}
ObjectDefineProperties(Writable.prototype, {
  closed: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.closed : false
    }
  },
  destroyed: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.destroyed : false
    },
    set(value) {
      // Backward compatibility, the user is explicitly managing destroyed.
      if (this._writableState) {
        this._writableState.destroyed = value
      }
    }
  },
  writable: {
    __proto__: null,
    get() {
      const w = this._writableState
      // w.writable === false means that this is part of a Duplex stream
      // where the writable side was disabled upon construction.
      // Compat. The user might manually disable writable side through
      // deprecated setter.
      return !!w && w.writable !== false && !w.destroyed && !w.errored && !w.ending && !w.ended
    },
    set(val) {
      // Backwards compatible.
      if (this._writableState) {
        this._writableState.writable = !!val
      }
    }
  },
  writableFinished: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.finished : false
    }
  },
  writableObjectMode: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.objectMode : false
    }
  },
  writableBuffer: {
    __proto__: null,
    get() {
      return this._writableState && this._writableState.getBuffer()
    }
  },
  writableEnded: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.ending : false
    }
  },
  writableNeedDrain: {
    __proto__: null,
    get() {
      const wState = this._writableState
      if (!wState) return false
      return !wState.destroyed && !wState.ending && wState.needDrain
    }
  },
  writableHighWaterMark: {
    __proto__: null,
    get() {
      return this._writableState && this._writableState.highWaterMark
    }
  },
  writableCorked: {
    __proto__: null,
    get() {
      return this._writableState ? this._writableState.corked : 0
    }
  },
  writableLength: {
    __proto__: null,
    get() {
      return this._writableState && this._writableState.length
    }
  },
  errored: {
    __proto__: null,
    enumerable: false,
    get() {
      return this._writableState ? this._writableState.errored : null
    }
  },
  writableAborted: {
    __proto__: null,
    enumerable: false,
    get: function () {
      return !!(
        this._writableState.writable !== false &&
        (this._writableState.destroyed || this._writableState.errored) &&
        !this._writableState.finished
      )
    }
  }
})
const destroy = destroyImpl.destroy
Writable.prototype.destroy = function (err, cb) {
  const state = this._writableState

  // Invoke pending callbacks.
  if (!state.destroyed && (state.bufferedIndex < state.buffered.length || state[kOnFinished].length)) {
    process.nextTick(errorBuffer, state)
  }
  destroy.call(this, err, cb)
  return this
}
Writable.prototype._undestroy = destroyImpl.undestroy
Writable.prototype._destroy = function (err, cb) {
  cb(err)
}
Writable.prototype[EE.captureRejectionSymbol] = function (err) {
  this.destroy(err)
}
let webStreamsAdapters

// Lazy to avoid circular references
function lazyWebStreams() {
  if (webStreamsAdapters === undefined) webStreamsAdapters = {}
  return webStreamsAdapters
}
Writable.fromWeb = function (writableStream, options) {
  return lazyWebStreams().newStreamWritableFromWritableStream(writableStream, options)
}
Writable.toWeb = function (streamWritable) {
  return lazyWebStreams().newWritableStreamFromStreamWritable(streamWritable)
}

},{"../../ours/errors":26,"../../ours/primordials":27,"./add-abort-signal":7,"./destroy":10,"./duplex":11,"./legacy":15,"./state":20,"buffer":3,"events":4,"process/":31}],24:[function(require,module,exports){
/* eslint jsdoc/require-jsdoc: "error" */

'use strict'

const {
  ArrayIsArray,
  ArrayPrototypeIncludes,
  ArrayPrototypeJoin,
  ArrayPrototypeMap,
  NumberIsInteger,
  NumberIsNaN,
  NumberMAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER,
  NumberParseInt,
  ObjectPrototypeHasOwnProperty,
  RegExpPrototypeExec,
  String,
  StringPrototypeToUpperCase,
  StringPrototypeTrim
} = require('../ours/primordials')
const {
  hideStackFrames,
  codes: { ERR_SOCKET_BAD_PORT, ERR_INVALID_ARG_TYPE, ERR_INVALID_ARG_VALUE, ERR_OUT_OF_RANGE, ERR_UNKNOWN_SIGNAL }
} = require('../ours/errors')
const { normalizeEncoding } = require('../ours/util')
const { isAsyncFunction, isArrayBufferView } = require('../ours/util').types
const signals = {}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isInt32(value) {
  return value === (value | 0)
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isUint32(value) {
  return value === value >>> 0
}
const octalReg = /^[0-7]+$/
const modeDesc = 'must be a 32-bit unsigned integer or an octal string'

/**
 * Parse and validate values that will be converted into mode_t (the S_*
 * constants). Only valid numbers and octal strings are allowed. They could be
 * converted to 32-bit unsigned integers or non-negative signed integers in the
 * C++ land, but any value higher than 0o777 will result in platform-specific
 * behaviors.
 * @param {*} value Values to be validated
 * @param {string} name Name of the argument
 * @param {number} [def] If specified, will be returned for invalid values
 * @returns {number}
 */
function parseFileMode(value, name, def) {
  if (typeof value === 'undefined') {
    value = def
  }
  if (typeof value === 'string') {
    if (RegExpPrototypeExec(octalReg, value) === null) {
      throw new ERR_INVALID_ARG_VALUE(name, value, modeDesc)
    }
    value = NumberParseInt(value, 8)
  }
  validateUint32(value, name)
  return value
}

/**
 * @callback validateInteger
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateInteger} */
const validateInteger = hideStackFrames((value, name, min = NumberMIN_SAFE_INTEGER, max = NumberMAX_SAFE_INTEGER) => {
  if (typeof value !== 'number') throw new ERR_INVALID_ARG_TYPE(name, 'number', value)
  if (!NumberIsInteger(value)) throw new ERR_OUT_OF_RANGE(name, 'an integer', value)
  if (value < min || value > max) throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value)
})

/**
 * @callback validateInt32
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateInt32} */
const validateInt32 = hideStackFrames((value, name, min = -2147483648, max = 2147483647) => {
  // The defaults for min and max correspond to the limits of 32-bit integers.
  if (typeof value !== 'number') {
    throw new ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
  if (!NumberIsInteger(value)) {
    throw new ERR_OUT_OF_RANGE(name, 'an integer', value)
  }
  if (value < min || value > max) {
    throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value)
  }
})

/**
 * @callback validateUint32
 * @param {*} value
 * @param {string} name
 * @param {number|boolean} [positive=false]
 * @returns {asserts value is number}
 */

/** @type {validateUint32} */
const validateUint32 = hideStackFrames((value, name, positive = false) => {
  if (typeof value !== 'number') {
    throw new ERR_INVALID_ARG_TYPE(name, 'number', value)
  }
  if (!NumberIsInteger(value)) {
    throw new ERR_OUT_OF_RANGE(name, 'an integer', value)
  }
  const min = positive ? 1 : 0
  // 2 ** 32 === 4294967296
  const max = 4294967295
  if (value < min || value > max) {
    throw new ERR_OUT_OF_RANGE(name, `>= ${min} && <= ${max}`, value)
  }
})

/**
 * @callback validateString
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is string}
 */

/** @type {validateString} */
function validateString(value, name) {
  if (typeof value !== 'string') throw new ERR_INVALID_ARG_TYPE(name, 'string', value)
}

/**
 * @callback validateNumber
 * @param {*} value
 * @param {string} name
 * @param {number} [min]
 * @param {number} [max]
 * @returns {asserts value is number}
 */

/** @type {validateNumber} */
function validateNumber(value, name, min = undefined, max) {
  if (typeof value !== 'number') throw new ERR_INVALID_ARG_TYPE(name, 'number', value)
  if (
    (min != null && value < min) ||
    (max != null && value > max) ||
    ((min != null || max != null) && NumberIsNaN(value))
  ) {
    throw new ERR_OUT_OF_RANGE(
      name,
      `${min != null ? `>= ${min}` : ''}${min != null && max != null ? ' && ' : ''}${max != null ? `<= ${max}` : ''}`,
      value
    )
  }
}

/**
 * @callback validateOneOf
 * @template T
 * @param {T} value
 * @param {string} name
 * @param {T[]} oneOf
 */

/** @type {validateOneOf} */
const validateOneOf = hideStackFrames((value, name, oneOf) => {
  if (!ArrayPrototypeIncludes(oneOf, value)) {
    const allowed = ArrayPrototypeJoin(
      ArrayPrototypeMap(oneOf, (v) => (typeof v === 'string' ? `'${v}'` : String(v))),
      ', '
    )
    const reason = 'must be one of: ' + allowed
    throw new ERR_INVALID_ARG_VALUE(name, value, reason)
  }
})

/**
 * @callback validateBoolean
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is boolean}
 */

/** @type {validateBoolean} */
function validateBoolean(value, name) {
  if (typeof value !== 'boolean') throw new ERR_INVALID_ARG_TYPE(name, 'boolean', value)
}

/**
 * @param {any} options
 * @param {string} key
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function getOwnPropertyValueOrDefault(options, key, defaultValue) {
  return options == null || !ObjectPrototypeHasOwnProperty(options, key) ? defaultValue : options[key]
}

/**
 * @callback validateObject
 * @param {*} value
 * @param {string} name
 * @param {{
 *   allowArray?: boolean,
 *   allowFunction?: boolean,
 *   nullable?: boolean
 * }} [options]
 */

/** @type {validateObject} */
const validateObject = hideStackFrames((value, name, options = null) => {
  const allowArray = getOwnPropertyValueOrDefault(options, 'allowArray', false)
  const allowFunction = getOwnPropertyValueOrDefault(options, 'allowFunction', false)
  const nullable = getOwnPropertyValueOrDefault(options, 'nullable', false)
  if (
    (!nullable && value === null) ||
    (!allowArray && ArrayIsArray(value)) ||
    (typeof value !== 'object' && (!allowFunction || typeof value !== 'function'))
  ) {
    throw new ERR_INVALID_ARG_TYPE(name, 'Object', value)
  }
})

/**
 * @callback validateDictionary - We are using the Web IDL Standard definition
 *                                of "dictionary" here, which means any value
 *                                whose Type is either Undefined, Null, or
 *                                Object (which includes functions).
 * @param {*} value
 * @param {string} name
 * @see https://webidl.spec.whatwg.org/#es-dictionary
 * @see https://tc39.es/ecma262/#table-typeof-operator-results
 */

/** @type {validateDictionary} */
const validateDictionary = hideStackFrames((value, name) => {
  if (value != null && typeof value !== 'object' && typeof value !== 'function') {
    throw new ERR_INVALID_ARG_TYPE(name, 'a dictionary', value)
  }
})

/**
 * @callback validateArray
 * @param {*} value
 * @param {string} name
 * @param {number} [minLength]
 * @returns {asserts value is any[]}
 */

/** @type {validateArray} */
const validateArray = hideStackFrames((value, name, minLength = 0) => {
  if (!ArrayIsArray(value)) {
    throw new ERR_INVALID_ARG_TYPE(name, 'Array', value)
  }
  if (value.length < minLength) {
    const reason = `must be longer than ${minLength}`
    throw new ERR_INVALID_ARG_VALUE(name, value, reason)
  }
})

/**
 * @callback validateStringArray
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is string[]}
 */

/** @type {validateStringArray} */
function validateStringArray(value, name) {
  validateArray(value, name)
  for (let i = 0; i < value.length; i++) {
    validateString(value[i], `${name}[${i}]`)
  }
}

/**
 * @callback validateBooleanArray
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is boolean[]}
 */

/** @type {validateBooleanArray} */
function validateBooleanArray(value, name) {
  validateArray(value, name)
  for (let i = 0; i < value.length; i++) {
    validateBoolean(value[i], `${name}[${i}]`)
  }
}

/**
 * @callback validateAbortSignalArray
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is AbortSignal[]}
 */

/** @type {validateAbortSignalArray} */
function validateAbortSignalArray(value, name) {
  validateArray(value, name)
  for (let i = 0; i < value.length; i++) {
    const signal = value[i]
    const indexedName = `${name}[${i}]`
    if (signal == null) {
      throw new ERR_INVALID_ARG_TYPE(indexedName, 'AbortSignal', signal)
    }
    validateAbortSignal(signal, indexedName)
  }
}

/**
 * @param {*} signal
 * @param {string} [name='signal']
 * @returns {asserts signal is keyof signals}
 */
function validateSignalName(signal, name = 'signal') {
  validateString(signal, name)
  if (signals[signal] === undefined) {
    if (signals[StringPrototypeToUpperCase(signal)] !== undefined) {
      throw new ERR_UNKNOWN_SIGNAL(signal + ' (signals must use all capital letters)')
    }
    throw new ERR_UNKNOWN_SIGNAL(signal)
  }
}

/**
 * @callback validateBuffer
 * @param {*} buffer
 * @param {string} [name='buffer']
 * @returns {asserts buffer is ArrayBufferView}
 */

/** @type {validateBuffer} */
const validateBuffer = hideStackFrames((buffer, name = 'buffer') => {
  if (!isArrayBufferView(buffer)) {
    throw new ERR_INVALID_ARG_TYPE(name, ['Buffer', 'TypedArray', 'DataView'], buffer)
  }
})

/**
 * @param {string} data
 * @param {string} encoding
 */
function validateEncoding(data, encoding) {
  const normalizedEncoding = normalizeEncoding(encoding)
  const length = data.length
  if (normalizedEncoding === 'hex' && length % 2 !== 0) {
    throw new ERR_INVALID_ARG_VALUE('encoding', encoding, `is invalid for data of length ${length}`)
  }
}

/**
 * Check that the port number is not NaN when coerced to a number,
 * is an integer and that it falls within the legal range of port numbers.
 * @param {*} port
 * @param {string} [name='Port']
 * @param {boolean} [allowZero=true]
 * @returns {number}
 */
function validatePort(port, name = 'Port', allowZero = true) {
  if (
    (typeof port !== 'number' && typeof port !== 'string') ||
    (typeof port === 'string' && StringPrototypeTrim(port).length === 0) ||
    +port !== +port >>> 0 ||
    port > 0xffff ||
    (port === 0 && !allowZero)
  ) {
    throw new ERR_SOCKET_BAD_PORT(name, port, allowZero)
  }
  return port | 0
}

/**
 * @callback validateAbortSignal
 * @param {*} signal
 * @param {string} name
 */

/** @type {validateAbortSignal} */
const validateAbortSignal = hideStackFrames((signal, name) => {
  if (signal !== undefined && (signal === null || typeof signal !== 'object' || !('aborted' in signal))) {
    throw new ERR_INVALID_ARG_TYPE(name, 'AbortSignal', signal)
  }
})

/**
 * @callback validateFunction
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is Function}
 */

/** @type {validateFunction} */
const validateFunction = hideStackFrames((value, name) => {
  if (typeof value !== 'function') throw new ERR_INVALID_ARG_TYPE(name, 'Function', value)
})

/**
 * @callback validatePlainFunction
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is Function}
 */

/** @type {validatePlainFunction} */
const validatePlainFunction = hideStackFrames((value, name) => {
  if (typeof value !== 'function' || isAsyncFunction(value)) throw new ERR_INVALID_ARG_TYPE(name, 'Function', value)
})

/**
 * @callback validateUndefined
 * @param {*} value
 * @param {string} name
 * @returns {asserts value is undefined}
 */

/** @type {validateUndefined} */
const validateUndefined = hideStackFrames((value, name) => {
  if (value !== undefined) throw new ERR_INVALID_ARG_TYPE(name, 'undefined', value)
})

/**
 * @template T
 * @param {T} value
 * @param {string} name
 * @param {T[]} union
 */
function validateUnion(value, name, union) {
  if (!ArrayPrototypeIncludes(union, value)) {
    throw new ERR_INVALID_ARG_TYPE(name, `('${ArrayPrototypeJoin(union, '|')}')`, value)
  }
}

/*
  The rules for the Link header field are described here:
  https://www.rfc-editor.org/rfc/rfc8288.html#section-3

  This regex validates any string surrounded by angle brackets
  (not necessarily a valid URI reference) followed by zero or more
  link-params separated by semicolons.
*/
const linkValueRegExp = /^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/

/**
 * @param {any} value
 * @param {string} name
 */
function validateLinkHeaderFormat(value, name) {
  if (typeof value === 'undefined' || !RegExpPrototypeExec(linkValueRegExp, value)) {
    throw new ERR_INVALID_ARG_VALUE(
      name,
      value,
      'must be an array or string of format "</styles.css>; rel=preload; as=style"'
    )
  }
}

/**
 * @param {any} hints
 * @return {string}
 */
function validateLinkHeaderValue(hints) {
  if (typeof hints === 'string') {
    validateLinkHeaderFormat(hints, 'hints')
    return hints
  } else if (ArrayIsArray(hints)) {
    const hintsLength = hints.length
    let result = ''
    if (hintsLength === 0) {
      return result
    }
    for (let i = 0; i < hintsLength; i++) {
      const link = hints[i]
      validateLinkHeaderFormat(link, 'hints')
      result += link
      if (i !== hintsLength - 1) {
        result += ', '
      }
    }
    return result
  }
  throw new ERR_INVALID_ARG_VALUE(
    'hints',
    hints,
    'must be an array or string of format "</styles.css>; rel=preload; as=style"'
  )
}
module.exports = {
  isInt32,
  isUint32,
  parseFileMode,
  validateArray,
  validateStringArray,
  validateBooleanArray,
  validateAbortSignalArray,
  validateBoolean,
  validateBuffer,
  validateDictionary,
  validateEncoding,
  validateFunction,
  validateInt32,
  validateInteger,
  validateNumber,
  validateObject,
  validateOneOf,
  validatePlainFunction,
  validatePort,
  validateSignalName,
  validateString,
  validateUint32,
  validateUndefined,
  validateUnion,
  validateAbortSignal,
  validateLinkHeaderValue
}

},{"../ours/errors":26,"../ours/primordials":27,"../ours/util":28}],25:[function(require,module,exports){
'use strict'

const CustomStream = require('../stream')
const promises = require('../stream/promises')
const originalDestroy = CustomStream.Readable.destroy
module.exports = CustomStream.Readable

// Explicit export naming is needed for ESM
module.exports._uint8ArrayToBuffer = CustomStream._uint8ArrayToBuffer
module.exports._isUint8Array = CustomStream._isUint8Array
module.exports.isDisturbed = CustomStream.isDisturbed
module.exports.isErrored = CustomStream.isErrored
module.exports.isReadable = CustomStream.isReadable
module.exports.Readable = CustomStream.Readable
module.exports.Writable = CustomStream.Writable
module.exports.Duplex = CustomStream.Duplex
module.exports.Transform = CustomStream.Transform
module.exports.PassThrough = CustomStream.PassThrough
module.exports.addAbortSignal = CustomStream.addAbortSignal
module.exports.finished = CustomStream.finished
module.exports.destroy = CustomStream.destroy
module.exports.destroy = originalDestroy
module.exports.pipeline = CustomStream.pipeline
module.exports.compose = CustomStream.compose
Object.defineProperty(CustomStream, 'promises', {
  configurable: true,
  enumerable: true,
  get() {
    return promises
  }
})
module.exports.Stream = CustomStream.Stream

// Allow default importing
module.exports.default = module.exports

},{"../stream":29,"../stream/promises":30}],26:[function(require,module,exports){
'use strict'

const { format, inspect, AggregateError: CustomAggregateError } = require('./util')

/*
  This file is a reduced and adapted version of the main lib/internal/errors.js file defined at

  https://github.com/nodejs/node/blob/master/lib/internal/errors.js

  Don't try to replace with the original file and keep it up to date (starting from E(...) definitions)
  with the upstream file.
*/

const AggregateError = globalThis.AggregateError || CustomAggregateError
const kIsNodeError = Symbol('kIsNodeError')
const kTypes = [
  'string',
  'function',
  'number',
  'object',
  // Accept 'Function' and 'Object' as alternative to the lower cased version.
  'Function',
  'Object',
  'boolean',
  'bigint',
  'symbol'
]
const classRegExp = /^([A-Z][a-z0-9]*)+$/
const nodeInternalPrefix = '__node_internal_'
const codes = {}
function assert(value, message) {
  if (!value) {
    throw new codes.ERR_INTERNAL_ASSERTION(message)
  }
}

// Only use this for integers! Decimal numbers do not work with this function.
function addNumericalSeparator(val) {
  let res = ''
  let i = val.length
  const start = val[0] === '-' ? 1 : 0
  for (; i >= start + 4; i -= 3) {
    res = `_${val.slice(i - 3, i)}${res}`
  }
  return `${val.slice(0, i)}${res}`
}
function getMessage(key, msg, args) {
  if (typeof msg === 'function') {
    assert(
      msg.length <= args.length,
      // Default options do not count.
      `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${msg.length}).`
    )
    return msg(...args)
  }
  const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length
  assert(
    expectedLength === args.length,
    `Code: ${key}; The provided arguments length (${args.length}) does not match the required ones (${expectedLength}).`
  )
  if (args.length === 0) {
    return msg
  }
  return format(msg, ...args)
}
function E(code, message, Base) {
  if (!Base) {
    Base = Error
  }
  class NodeError extends Base {
    constructor(...args) {
      super(getMessage(code, message, args))
    }
    toString() {
      return `${this.name} [${code}]: ${this.message}`
    }
  }
  Object.defineProperties(NodeError.prototype, {
    name: {
      value: Base.name,
      writable: true,
      enumerable: false,
      configurable: true
    },
    toString: {
      value() {
        return `${this.name} [${code}]: ${this.message}`
      },
      writable: true,
      enumerable: false,
      configurable: true
    }
  })
  NodeError.prototype.code = code
  NodeError.prototype[kIsNodeError] = true
  codes[code] = NodeError
}
function hideStackFrames(fn) {
  // We rename the functions that will be hidden to cut off the stacktrace
  // at the outermost one
  const hidden = nodeInternalPrefix + fn.name
  Object.defineProperty(fn, 'name', {
    value: hidden
  })
  return fn
}
function aggregateTwoErrors(innerError, outerError) {
  if (innerError && outerError && innerError !== outerError) {
    if (Array.isArray(outerError.errors)) {
      // If `outerError` is already an `AggregateError`.
      outerError.errors.push(innerError)
      return outerError
    }
    const err = new AggregateError([outerError, innerError], outerError.message)
    err.code = outerError.code
    return err
  }
  return innerError || outerError
}
class AbortError extends Error {
  constructor(message = 'The operation was aborted', options = undefined) {
    if (options !== undefined && typeof options !== 'object') {
      throw new codes.ERR_INVALID_ARG_TYPE('options', 'Object', options)
    }
    super(message, options)
    this.code = 'ABORT_ERR'
    this.name = 'AbortError'
  }
}
E('ERR_ASSERTION', '%s', Error)
E(
  'ERR_INVALID_ARG_TYPE',
  (name, expected, actual) => {
    assert(typeof name === 'string', "'name' must be a string")
    if (!Array.isArray(expected)) {
      expected = [expected]
    }
    let msg = 'The '
    if (name.endsWith(' argument')) {
      // For cases like 'first argument'
      msg += `${name} `
    } else {
      msg += `"${name}" ${name.includes('.') ? 'property' : 'argument'} `
    }
    msg += 'must be '
    const types = []
    const instances = []
    const other = []
    for (const value of expected) {
      assert(typeof value === 'string', 'All expected entries have to be of type string')
      if (kTypes.includes(value)) {
        types.push(value.toLowerCase())
      } else if (classRegExp.test(value)) {
        instances.push(value)
      } else {
        assert(value !== 'object', 'The value "object" should be written as "Object"')
        other.push(value)
      }
    }

    // Special handle `object` in case other instances are allowed to outline
    // the differences between each other.
    if (instances.length > 0) {
      const pos = types.indexOf('object')
      if (pos !== -1) {
        types.splice(types, pos, 1)
        instances.push('Object')
      }
    }
    if (types.length > 0) {
      switch (types.length) {
        case 1:
          msg += `of type ${types[0]}`
          break
        case 2:
          msg += `one of type ${types[0]} or ${types[1]}`
          break
        default: {
          const last = types.pop()
          msg += `one of type ${types.join(', ')}, or ${last}`
        }
      }
      if (instances.length > 0 || other.length > 0) {
        msg += ' or '
      }
    }
    if (instances.length > 0) {
      switch (instances.length) {
        case 1:
          msg += `an instance of ${instances[0]}`
          break
        case 2:
          msg += `an instance of ${instances[0]} or ${instances[1]}`
          break
        default: {
          const last = instances.pop()
          msg += `an instance of ${instances.join(', ')}, or ${last}`
        }
      }
      if (other.length > 0) {
        msg += ' or '
      }
    }
    switch (other.length) {
      case 0:
        break
      case 1:
        if (other[0].toLowerCase() !== other[0]) {
          msg += 'an '
        }
        msg += `${other[0]}`
        break
      case 2:
        msg += `one of ${other[0]} or ${other[1]}`
        break
      default: {
        const last = other.pop()
        msg += `one of ${other.join(', ')}, or ${last}`
      }
    }
    if (actual == null) {
      msg += `. Received ${actual}`
    } else if (typeof actual === 'function' && actual.name) {
      msg += `. Received function ${actual.name}`
    } else if (typeof actual === 'object') {
      var _actual$constructor
      if (
        (_actual$constructor = actual.constructor) !== null &&
        _actual$constructor !== undefined &&
        _actual$constructor.name
      ) {
        msg += `. Received an instance of ${actual.constructor.name}`
      } else {
        const inspected = inspect(actual, {
          depth: -1
        })
        msg += `. Received ${inspected}`
      }
    } else {
      let inspected = inspect(actual, {
        colors: false
      })
      if (inspected.length > 25) {
        inspected = `${inspected.slice(0, 25)}...`
      }
      msg += `. Received type ${typeof actual} (${inspected})`
    }
    return msg
  },
  TypeError
)
E(
  'ERR_INVALID_ARG_VALUE',
  (name, value, reason = 'is invalid') => {
    let inspected = inspect(value)
    if (inspected.length > 128) {
      inspected = inspected.slice(0, 128) + '...'
    }
    const type = name.includes('.') ? 'property' : 'argument'
    return `The ${type} '${name}' ${reason}. Received ${inspected}`
  },
  TypeError
)
E(
  'ERR_INVALID_RETURN_VALUE',
  (input, name, value) => {
    var _value$constructor
    const type =
      value !== null &&
      value !== undefined &&
      (_value$constructor = value.constructor) !== null &&
      _value$constructor !== undefined &&
      _value$constructor.name
        ? `instance of ${value.constructor.name}`
        : `type ${typeof value}`
    return `Expected ${input} to be returned from the "${name}"` + ` function but got ${type}.`
  },
  TypeError
)
E(
  'ERR_MISSING_ARGS',
  (...args) => {
    assert(args.length > 0, 'At least one arg needs to be specified')
    let msg
    const len = args.length
    args = (Array.isArray(args) ? args : [args]).map((a) => `"${a}"`).join(' or ')
    switch (len) {
      case 1:
        msg += `The ${args[0]} argument`
        break
      case 2:
        msg += `The ${args[0]} and ${args[1]} arguments`
        break
      default:
        {
          const last = args.pop()
          msg += `The ${args.join(', ')}, and ${last} arguments`
        }
        break
    }
    return `${msg} must be specified`
  },
  TypeError
)
E(
  'ERR_OUT_OF_RANGE',
  (str, range, input) => {
    assert(range, 'Missing "range" argument')
    let received
    if (Number.isInteger(input) && Math.abs(input) > 2 ** 32) {
      received = addNumericalSeparator(String(input))
    } else if (typeof input === 'bigint') {
      received = String(input)
      if (input > 2n ** 32n || input < -(2n ** 32n)) {
        received = addNumericalSeparator(received)
      }
      received += 'n'
    } else {
      received = inspect(input)
    }
    return `The value of "${str}" is out of range. It must be ${range}. Received ${received}`
  },
  RangeError
)
E('ERR_MULTIPLE_CALLBACK', 'Callback called multiple times', Error)
E('ERR_METHOD_NOT_IMPLEMENTED', 'The %s method is not implemented', Error)
E('ERR_STREAM_ALREADY_FINISHED', 'Cannot call %s after a stream was finished', Error)
E('ERR_STREAM_CANNOT_PIPE', 'Cannot pipe, not readable', Error)
E('ERR_STREAM_DESTROYED', 'Cannot call %s after a stream was destroyed', Error)
E('ERR_STREAM_NULL_VALUES', 'May not write null values to stream', TypeError)
E('ERR_STREAM_PREMATURE_CLOSE', 'Premature close', Error)
E('ERR_STREAM_PUSH_AFTER_EOF', 'stream.push() after EOF', Error)
E('ERR_STREAM_UNSHIFT_AFTER_END_EVENT', 'stream.unshift() after end event', Error)
E('ERR_STREAM_WRITE_AFTER_END', 'write after end', Error)
E('ERR_UNKNOWN_ENCODING', 'Unknown encoding: %s', TypeError)
module.exports = {
  AbortError,
  aggregateTwoErrors: hideStackFrames(aggregateTwoErrors),
  hideStackFrames,
  codes
}

},{"./util":28}],27:[function(require,module,exports){
'use strict'

/*
  This file is a reduced and adapted version of the main lib/internal/per_context/primordials.js file defined at

  https://github.com/nodejs/node/blob/master/lib/internal/per_context/primordials.js

  Don't try to replace with the original file and keep it up to date with the upstream file.
*/
module.exports = {
  ArrayIsArray(self) {
    return Array.isArray(self)
  },
  ArrayPrototypeIncludes(self, el) {
    return self.includes(el)
  },
  ArrayPrototypeIndexOf(self, el) {
    return self.indexOf(el)
  },
  ArrayPrototypeJoin(self, sep) {
    return self.join(sep)
  },
  ArrayPrototypeMap(self, fn) {
    return self.map(fn)
  },
  ArrayPrototypePop(self, el) {
    return self.pop(el)
  },
  ArrayPrototypePush(self, el) {
    return self.push(el)
  },
  ArrayPrototypeSlice(self, start, end) {
    return self.slice(start, end)
  },
  Error,
  FunctionPrototypeCall(fn, thisArgs, ...args) {
    return fn.call(thisArgs, ...args)
  },
  FunctionPrototypeSymbolHasInstance(self, instance) {
    return Function.prototype[Symbol.hasInstance].call(self, instance)
  },
  MathFloor: Math.floor,
  Number,
  NumberIsInteger: Number.isInteger,
  NumberIsNaN: Number.isNaN,
  NumberMAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  NumberMIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  NumberParseInt: Number.parseInt,
  ObjectDefineProperties(self, props) {
    return Object.defineProperties(self, props)
  },
  ObjectDefineProperty(self, name, prop) {
    return Object.defineProperty(self, name, prop)
  },
  ObjectGetOwnPropertyDescriptor(self, name) {
    return Object.getOwnPropertyDescriptor(self, name)
  },
  ObjectKeys(obj) {
    return Object.keys(obj)
  },
  ObjectSetPrototypeOf(target, proto) {
    return Object.setPrototypeOf(target, proto)
  },
  Promise,
  PromisePrototypeCatch(self, fn) {
    return self.catch(fn)
  },
  PromisePrototypeThen(self, thenFn, catchFn) {
    return self.then(thenFn, catchFn)
  },
  PromiseReject(err) {
    return Promise.reject(err)
  },
  PromiseResolve(val) {
    return Promise.resolve(val)
  },
  ReflectApply: Reflect.apply,
  RegExpPrototypeTest(self, value) {
    return self.test(value)
  },
  SafeSet: Set,
  String,
  StringPrototypeSlice(self, start, end) {
    return self.slice(start, end)
  },
  StringPrototypeToLowerCase(self) {
    return self.toLowerCase()
  },
  StringPrototypeToUpperCase(self) {
    return self.toUpperCase()
  },
  StringPrototypeTrim(self) {
    return self.trim()
  },
  Symbol,
  SymbolFor: Symbol.for,
  SymbolAsyncIterator: Symbol.asyncIterator,
  SymbolHasInstance: Symbol.hasInstance,
  SymbolIterator: Symbol.iterator,
  SymbolDispose: Symbol.dispose || Symbol('Symbol.dispose'),
  SymbolAsyncDispose: Symbol.asyncDispose || Symbol('Symbol.asyncDispose'),
  TypedArrayPrototypeSet(self, buf, len) {
    return self.set(buf, len)
  },
  Boolean: Boolean,
  Uint8Array
}

},{}],28:[function(require,module,exports){
'use strict'

const bufferModule = require('buffer')
const { kResistStopPropagation, SymbolDispose } = require('./primordials')
const AbortSignal = globalThis.AbortSignal || require('abort-controller').AbortSignal
const AbortController = globalThis.AbortController || require('abort-controller').AbortController
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const Blob = globalThis.Blob || bufferModule.Blob
/* eslint-disable indent */
const isBlob =
  typeof Blob !== 'undefined'
    ? function isBlob(b) {
        // eslint-disable-next-line indent
        return b instanceof Blob
      }
    : function isBlob(b) {
        return false
      }
/* eslint-enable indent */

const validateAbortSignal = (signal, name) => {
  if (signal !== undefined && (signal === null || typeof signal !== 'object' || !('aborted' in signal))) {
    throw new ERR_INVALID_ARG_TYPE(name, 'AbortSignal', signal)
  }
}
const validateFunction = (value, name) => {
  if (typeof value !== 'function') throw new ERR_INVALID_ARG_TYPE(name, 'Function', value)
}

// This is a simplified version of AggregateError
class AggregateError extends Error {
  constructor(errors) {
    if (!Array.isArray(errors)) {
      throw new TypeError(`Expected input to be an Array, got ${typeof errors}`)
    }
    let message = ''
    for (let i = 0; i < errors.length; i++) {
      message += `    ${errors[i].stack}\n`
    }
    super(message)
    this.name = 'AggregateError'
    this.errors = errors
  }
}
module.exports = {
  AggregateError,
  kEmptyObject: Object.freeze({}),
  once(callback) {
    let called = false
    return function (...args) {
      if (called) {
        return
      }
      called = true
      callback.apply(this, args)
    }
  },
  createDeferredPromise: function () {
    let resolve
    let reject

    // eslint-disable-next-line promise/param-names
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return {
      promise,
      resolve,
      reject
    }
  },
  promisify(fn) {
    return new Promise((resolve, reject) => {
      fn((err, ...args) => {
        if (err) {
          return reject(err)
        }
        return resolve(...args)
      })
    })
  },
  debuglog() {
    return function () {}
  },
  format(format, ...args) {
    // Simplified version of https://nodejs.org/api/util.html#utilformatformat-args
    return format.replace(/%([sdifj])/g, function (...[_unused, type]) {
      const replacement = args.shift()
      if (type === 'f') {
        return replacement.toFixed(6)
      } else if (type === 'j') {
        return JSON.stringify(replacement)
      } else if (type === 's' && typeof replacement === 'object') {
        const ctor = replacement.constructor !== Object ? replacement.constructor.name : ''
        return `${ctor} {}`.trim()
      } else {
        return replacement.toString()
      }
    })
  },
  inspect(value) {
    // Vastly simplified version of https://nodejs.org/api/util.html#utilinspectobject-options
    switch (typeof value) {
      case 'string':
        if (value.includes("'")) {
          if (!value.includes('"')) {
            return `"${value}"`
          } else if (!value.includes('`') && !value.includes('${')) {
            return `\`${value}\``
          }
        }
        return `'${value}'`
      case 'number':
        if (isNaN(value)) {
          return 'NaN'
        } else if (Object.is(value, -0)) {
          return String(value)
        }
        return value
      case 'bigint':
        return `${String(value)}n`
      case 'boolean':
      case 'undefined':
        return String(value)
      case 'object':
        return '{}'
    }
  },
  types: {
    isAsyncFunction(fn) {
      return fn instanceof AsyncFunction
    },
    isArrayBufferView(arr) {
      return ArrayBuffer.isView(arr)
    }
  },
  isBlob,
  deprecate(fn, message) {
    return fn
  },
  addAbortListener:
    require('events').addAbortListener ||
    function addAbortListener(signal, listener) {
      if (signal === undefined) {
        throw new ERR_INVALID_ARG_TYPE('signal', 'AbortSignal', signal)
      }
      validateAbortSignal(signal, 'signal')
      validateFunction(listener, 'listener')
      let removeEventListener
      if (signal.aborted) {
        queueMicrotask(() => listener())
      } else {
        signal.addEventListener('abort', listener, {
          __proto__: null,
          once: true,
          [kResistStopPropagation]: true
        })
        removeEventListener = () => {
          signal.removeEventListener('abort', listener)
        }
      }
      return {
        __proto__: null,
        [SymbolDispose]() {
          var _removeEventListener
          ;(_removeEventListener = removeEventListener) === null || _removeEventListener === undefined
            ? undefined
            : _removeEventListener()
        }
      }
    },
  AbortSignalAny:
    AbortSignal.any ||
    function AbortSignalAny(signals) {
      // Fast path if there is only one signal.
      if (signals.length === 1) {
        return signals[0]
      }
      const ac = new AbortController()
      const abort = () => ac.abort()
      signals.forEach((signal) => {
        validateAbortSignal(signal, 'signals')
        signal.addEventListener('abort', abort, {
          once: true
        })
      })
      ac.signal.addEventListener(
        'abort',
        () => {
          signals.forEach((signal) => signal.removeEventListener('abort', abort))
        },
        {
          once: true
        }
      )
      return ac.signal
    }
}
module.exports.promisify.custom = Symbol.for('nodejs.util.promisify.custom')

},{"./primordials":27,"abort-controller":1,"buffer":3,"events":4}],29:[function(require,module,exports){
/* replacement start */

const { Buffer } = require('buffer')

/* replacement end */
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

;('use strict')
const { ObjectDefineProperty, ObjectKeys, ReflectApply } = require('./ours/primordials')
const {
  promisify: { custom: customPromisify }
} = require('./ours/util')
const { streamReturningOperators, promiseReturningOperators } = require('./internal/streams/operators')
const {
  codes: { ERR_ILLEGAL_CONSTRUCTOR }
} = require('./ours/errors')
const compose = require('./internal/streams/compose')
const { setDefaultHighWaterMark, getDefaultHighWaterMark } = require('./internal/streams/state')
const { pipeline } = require('./internal/streams/pipeline')
const { destroyer } = require('./internal/streams/destroy')
const eos = require('./internal/streams/end-of-stream')
const internalBuffer = {}
const promises = require('./stream/promises')
const utils = require('./internal/streams/utils')
const Stream = (module.exports = require('./internal/streams/legacy').Stream)
Stream.isDestroyed = utils.isDestroyed
Stream.isDisturbed = utils.isDisturbed
Stream.isErrored = utils.isErrored
Stream.isReadable = utils.isReadable
Stream.isWritable = utils.isWritable
Stream.Readable = require('./internal/streams/readable')
for (const key of ObjectKeys(streamReturningOperators)) {
  const op = streamReturningOperators[key]
  function fn(...args) {
    if (new.target) {
      throw ERR_ILLEGAL_CONSTRUCTOR()
    }
    return Stream.Readable.from(ReflectApply(op, this, args))
  }
  ObjectDefineProperty(fn, 'name', {
    __proto__: null,
    value: op.name
  })
  ObjectDefineProperty(fn, 'length', {
    __proto__: null,
    value: op.length
  })
  ObjectDefineProperty(Stream.Readable.prototype, key, {
    __proto__: null,
    value: fn,
    enumerable: false,
    configurable: true,
    writable: true
  })
}
for (const key of ObjectKeys(promiseReturningOperators)) {
  const op = promiseReturningOperators[key]
  function fn(...args) {
    if (new.target) {
      throw ERR_ILLEGAL_CONSTRUCTOR()
    }
    return ReflectApply(op, this, args)
  }
  ObjectDefineProperty(fn, 'name', {
    __proto__: null,
    value: op.name
  })
  ObjectDefineProperty(fn, 'length', {
    __proto__: null,
    value: op.length
  })
  ObjectDefineProperty(Stream.Readable.prototype, key, {
    __proto__: null,
    value: fn,
    enumerable: false,
    configurable: true,
    writable: true
  })
}
Stream.Writable = require('./internal/streams/writable')
Stream.Duplex = require('./internal/streams/duplex')
Stream.Transform = require('./internal/streams/transform')
Stream.PassThrough = require('./internal/streams/passthrough')
Stream.pipeline = pipeline
const { addAbortSignal } = require('./internal/streams/add-abort-signal')
Stream.addAbortSignal = addAbortSignal
Stream.finished = eos
Stream.destroy = destroyer
Stream.compose = compose
Stream.setDefaultHighWaterMark = setDefaultHighWaterMark
Stream.getDefaultHighWaterMark = getDefaultHighWaterMark
ObjectDefineProperty(Stream, 'promises', {
  __proto__: null,
  configurable: true,
  enumerable: true,
  get() {
    return promises
  }
})
ObjectDefineProperty(pipeline, customPromisify, {
  __proto__: null,
  enumerable: true,
  get() {
    return promises.pipeline
  }
})
ObjectDefineProperty(eos, customPromisify, {
  __proto__: null,
  enumerable: true,
  get() {
    return promises.finished
  }
})

// Backwards-compat with node 0.4.x
Stream.Stream = Stream
Stream._isUint8Array = function isUint8Array(value) {
  return value instanceof Uint8Array
}
Stream._uint8ArrayToBuffer = function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength)
}

},{"./internal/streams/add-abort-signal":7,"./internal/streams/compose":9,"./internal/streams/destroy":10,"./internal/streams/duplex":11,"./internal/streams/end-of-stream":13,"./internal/streams/legacy":15,"./internal/streams/operators":16,"./internal/streams/passthrough":17,"./internal/streams/pipeline":18,"./internal/streams/readable":19,"./internal/streams/state":20,"./internal/streams/transform":21,"./internal/streams/utils":22,"./internal/streams/writable":23,"./ours/errors":26,"./ours/primordials":27,"./ours/util":28,"./stream/promises":30,"buffer":3}],30:[function(require,module,exports){
'use strict'

const { ArrayPrototypePop, Promise } = require('../ours/primordials')
const { isIterable, isNodeStream, isWebStream } = require('../internal/streams/utils')
const { pipelineImpl: pl } = require('../internal/streams/pipeline')
const { finished } = require('../internal/streams/end-of-stream')
require('../../lib/stream.js')
function pipeline(...streams) {
  return new Promise((resolve, reject) => {
    let signal
    let end
    const lastArg = streams[streams.length - 1]
    if (
      lastArg &&
      typeof lastArg === 'object' &&
      !isNodeStream(lastArg) &&
      !isIterable(lastArg) &&
      !isWebStream(lastArg)
    ) {
      const options = ArrayPrototypePop(streams)
      signal = options.signal
      end = options.end
    }
    pl(
      streams,
      (err, value) => {
        if (err) {
          reject(err)
        } else {
          resolve(value)
        }
      },
      {
        signal,
        end
      }
    )
  })
}
module.exports = {
  finished,
  pipeline
}

},{"../../lib/stream.js":29,"../internal/streams/end-of-stream":13,"../internal/streams/pipeline":18,"../internal/streams/utils":22,"../ours/primordials":27}],31:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],32:[function(require,module,exports){
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.prototype = Object.create(Buffer.prototype)

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":3}],33:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":32}],34:[function(require,module,exports){
(function (setImmediate,clearImmediate){(function (){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this)}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":31,"timers":34}],35:[function(require,module,exports){
module.exports={
  "name": "pokeclicker",
  "version": "0.10.22",
  "description": "PokéClicker repository",
  "main": "index.js",
  "scripts": {
    "start": "cross-env NODE_ENV=development gulp",
    "build": "cross-env NODE_ENV=development gulp build",
    "test": "npm-run-all --continue-on-error test-scripts eslint stylelint",
    "test-scripts": "gulp scripts && npm run vitest-nocoverage",
    "vitest": "vitest --run",
    "vitest-nocoverage": "vitest --run --coverage false",
    "eslint": "eslint --ext ts ./src/scripts ./src/modules",
    "eslint-fix": "eslint --ext ts --fix ./src/scripts ./src/modules",
    "stylelint": "stylelint \"./src/**/*.less\" --cache",
    "stylelint-fix": "npm run stylelint -- --fix",
    "website": "npm run tl:update && npm test && cross-env NODE_ENV=production gulp website",
    "publish": "npm test && node publish.js",
    "tl:init": "git submodule update --init",
    "tl:update": "git submodule update --remote",
    "clean": "npm ci && npm run tl:init"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/pokeclicker/pokeclicker.git"
  },
  "babel": {
    "presets": [
      "env"
    ]
  },
  "author": "RedSparr0w",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/pokeclicker/pokeclicker/issues"
  },
  "homepage": "https://github.com/pokeclicker/pokeclicker#readme",
  "devDependencies": {
    "@types/bootstrap": "^4.3.1",
    "@types/bootstrap-notify": "^3.1.34",
    "@types/intro.js": "^2.4.7",
    "@types/jquery": "^3.5.16",
    "@types/knockout": "^3.4.66",
    "@types/sortablejs": "^1.10.5",
    "@typescript-eslint/eslint-plugin": "^5.50.0",
    "@typescript-eslint/parser": "^5.50.0",
    "@vitest/coverage-v8": "^2.1.1",
    "babel-core": "^6.26.3",
    "babel-preset-env": "^1.7.0",
    "babel-register": "^6.26.0",
    "bootstrap-notify": "^3.1.3",
    "browser-sync": "^2.28.3",
    "cross-env": "^7.0.2",
    "del": "^5.1.0",
    "es6-promise": "^4.2.8",
    "eslint": "^7.32.0",
    "eslint-config-airbnb-typescript": "^17.0.0",
    "eslint-plugin-import": "^2.22.1",
    "gh-pages": "^4.0.0",
    "gulp": "^4.0.2",
    "gulp-autoprefixer": "^7.0.1",
    "gulp-changed": "^4.0.2",
    "gulp-clean": "^0.4.0",
    "gulp-concat": "^2.6.0",
    "gulp-connect": "^5.7.0",
    "gulp-ejs": "^5.1.0",
    "gulp-file-include": "^2.2.2",
    "gulp-filter": "^6.0.0",
    "gulp-html-import": "^0.0.2",
    "gulp-less": "^4.0.1",
    "gulp-minify-css": "^1.2.1",
    "gulp-minify-html": "^1.0.4",
    "gulp-plumber": "^1.2.1",
    "gulp-rename": "^2.0.0",
    "gulp-replace": "^1.0.0",
    "gulp-size": "^3.0.0",
    "gulp-sourcemaps": "^2.6.5",
    "gulp-stream-to-promise": "^0.1.0",
    "gulp-strip-debug": "^3.0.0",
    "gulp-typescript": "^5.0.1",
    "gulp-util": "^3.0.7",
    "husky": "^4.3.8",
    "jsdom": "^25.0.0",
    "natives": "^1.1.6",
    "npm-run-all2": "^6.2.0",
    "postcss-less": "^6.0.0",
    "stylelint": "^15.10.1",
    "stylelint-config-standard-less": "^1.0.0",
    "ts-loader": "^8.0.4",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.5",
    "vitest": "^2.1.1",
    "webpack": "^5.76.0",
    "webpack-cli": "^5.0.1",
    "webpack-stream": "^6.1.0"
  },
  "dependencies": {
    "bootstrap": "^4.5.3",
    "i18next": "^21.9.2",
    "i18next-browser-languagedetector": "^6.1.5",
    "i18next-chained-backend": "^3.1.0",
    "i18next-http-backend": "^1.4.4",
    "intro.js": "^2.9.3",
    "jquery": "^3.5.1",
    "knockout": "^3.5.1",
    "popper.js": "^1.16.0",
    "sortablejs": "^1.10.2"
  }
}

},{}],36:[function(require,module,exports){
const partyList = ko.pureComputed(() => {
    const saveData = SaveData.file();
    const party = saveData?.save.party.caughtPokemon ?? [];
    const statistics = saveData?.save.statistics;

    return party.filter(p => Companion.data.obtainablePokemonMap[p.id]).reduce((_map, p) => {
        const partyPokemon = PokemonFactory.generatePartyPokemon(p.id);
        partyPokemon.fromJSON(p);

        partyPokemon.totalAttack = partyPokemon.calculateAttack(100);
        partyPokemon.baseBreedingEff = (partyPokemon.getBreedingAttackBonus() / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        const heldItemBonus = partyPokemon.heldItem && partyPokemon.heldItem() instanceof AttackBonusHeldItem ? partyPokemon.heldItem().attackBonus : 1;
        const shadowBonus = partyPokemon.shadow == GameConstants.ShadowStatus.Shadow ? 0.8 : (partyPokemon.shadow == GameConstants.ShadowStatus.Purified ? 1.2 : 1);
        const attackBonus = partyPokemon.getBreedingAttackBonus() * partyPokemon.calculateEVAttackBonus() * heldItemBonus * shadowBonus;
        partyPokemon.breedingEff = (attackBonus / partyPokemon.getEggSteps()) * GameConstants.EGG_CYCLE_MULTIPLIER;

        partyPokemon.statistics = {
            totalObtained: statistics.pokemonCaptured[p.id] || 0,
            totalHatched: statistics.pokemonHatched[p.id] || 0,
            totalShinyObtained: statistics.shinyPokemonCaptured[p.id] || 0,
            totalShinyHatched: statistics.shinyPokemonHatched[p.id] || 0,
            totalDefeated: statistics.pokemonDefeated[p.id] || 0,
        };

        _map[p.id] = partyPokemon;
        return _map;
    }, {});
});

const pokemonStatTableSearch = ko.observable('');
const pokemonStatTableFilter = ko.observable('none');
const pokemonStatTableSort = ko.observable('id');
const pokemonStatTableSortDir = ko.observable(false);

const getSortedPartyList = ko.pureComputed(() => {
    const sortOption = pokemonStatTableSort();
    const sortDirection = pokemonStatTableSortDir();
    return Object.values(partyList()).sort(compareBy(sortOption, sortDirection));
}).extend({ rateLimit: 100 });

const getMissingPokemon = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const caughtPokemon = partyList();
    const missingPokemon = {
        ...GameHelper.enumNumbers(GameConstants.Region)
            .filter(r => r !== GameConstants.Region.none && r <= GameConstants.MAX_AVAILABLE_REGION)
            .map(r => {
                return {
                    region: r,
                    regionName: GameConstants.camelCaseToString(GameConstants.Region[r]),
                    pokemon: []
                };
            })
    };

    missingPokemon[-2] = {
        region: -2,
        regionName: 'Event / Discord / Client',
        pokemon: []
    };

    const saveData = SaveData.file();
    const showRequiredOnly = Companion.settings.showRequiredOnly();
    const showAllRegions = Companion.settings.showAllRegions();

    Companion.data.obtainablePokemonList.forEach(p => {
        if (caughtPokemon[p.id]) {
            return;
        }

        const obtainRegion = p.obtainRegion;
        if (!showAllRegions && obtainRegion > player.highestRegion()) {
            return;
        }

        if (showRequiredOnly) {
            if (obtainRegion == -2) {
                return;
            }

            const formCaught = saveData.save.party.caughtPokemon.some(c => Math.floor(c.id) == Math.floor(p.id));
            if (formCaught) {
                return;
            }
        }

        missingPokemon[obtainRegion].pokemon.push(p);
    });

    return Object.values(missingPokemon).filter(r => r.pokemon.length);
});

const getMissingRegionPokemonCount = (region) => {
    return ko.pureComputed(() => {
        const data = getMissingPokemon().find(r => r.region == region);
        if (!data) {
            return 0;
        }

        return Companion.settings.showRequiredOnly() ? (new Set(data.pokemon.map(p => Math.floor(p.id)))).size : data.pokemon.length;
    });
};

const getTotalMissingPokemonCount = ko.pureComputed(() => {
    return getMissingPokemon().reduce((count, r) => {
        return count + getMissingRegionPokemonCount(r.region)();
    }, 0);
});

const caughtPokemonCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => Companion.data.obtainablePokemonMap[p.id]).length;
});

const caughtShinyCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => Companion.data.obtainablePokemonMap[p.id]
            && p[PartyPokemonSaveKeys.shiny] === true).length;
});

const caughtResistantCount = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    return SaveData.file().save.party.caughtPokemon
        .filter(p => Companion.data.obtainablePokemonMap[p.id]
            && p[PartyPokemonSaveKeys.pokerus] === GameConstants.Pokerus.Resistant).length;
});

const hideFromPokemonStatsTable = (partyPokemon) => {
    return ko.pureComputed(() => {
        const searchVal = pokemonStatTableSearch();
        if (searchVal) {
            if (!partyPokemon.id.toString().includes(searchVal)
                && !partyPokemon.name.toLowerCase().includes(searchVal.toLowerCase())) {
                return true;
            }
        }

        const filterVal = pokemonStatTableFilter();

        if (filterVal) {
            const isResistant = partyPokemon.pokerus === GameConstants.Pokerus.Resistant;
            const isFriendSafari = FriendSafari.isInRotation(partyPokemon.name);

            switch (filterVal) {
                case 'not-shiny':
                    if (partyPokemon.shiny) {
                        return true;
                    }
                    break;
                case 'not-resistant':
                    if (isResistant) {
                        return true;
                    }
                    break;
                case 'not-resistant-not-friend-safari':
                    if (isResistant || isFriendSafari) {
                        return true;
                    }
                    break;
                case 'not-resistant-friend-safari':
                    if (isResistant || !isFriendSafari) {
                        return true;
                    }
                    break;
                case 'resistant':
                    if (!isResistant) {
                        return true;
                    }
                    break;
                case 'infected':
                    if (partyPokemon.pokerus != GameConstants.Pokerus.Infected) {
                        return true;
                    }
                    break;
                case 'missing-shadow':
                    if (partyPokemon.shadow || !Companion.data.shadowPokemon.has(partyPokemon.name)) {
                        return true;
                    }
                break;
                case 'missing-purified':
                    if (partyPokemon.shadow == GameConstants.ShadowStatus.Purified || !Companion.data.shadowPokemon.has(partyPokemon.name)) {
                        return true;
                    }
                break;
                case 'shadow':
                    if (partyPokemon.shadow != GameConstants.ShadowStatus.Shadow) {
                        return true;
                    }
                break;
                case 'purified':
                    if (partyPokemon.shadow != GameConstants.ShadowStatus.Purified) {
                        return true;
                    }
                break;
            }
        }

        return false;
    });
};

const getPokemonStatsTableCount = ko.pureComputed(() => {
    return Object.values(partyList()).reduce((sum, p) => !hideFromPokemonStatsTable(p)() ? sum + 1 : sum, 0);
});

const isEventDiscordClientPokemon = (pokemonName) => {
    return Companion.data.EventDiscordClientPokemon.includes(pokemonName);
};

const isPokemonCaught = (pokemonName) => {
    return partyList()[PokemonHelper.getPokemonByName(pokemonName).id] != undefined;
};

const getCaughtPokeballImage = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    if (partyPokemon) {
        return `assets/images/pokeball/Pokeball${partyPokemon.shiny ? '-shiny' : ''}.svg`;
    } else {
        return '';
    }
};

const hasPokerus = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    return (partyPokemon?.pokerus ?? 0) > 0;
};

const getPokerusImage = (pokemonName) => {
    const partyPokemon = partyList()[PokemonHelper.getPokemonByName(pokemonName).id];
    if (!partyPokemon || partyPokemon.pokerus == GameConstants.Pokerus.Uninfected) {
        return '//:0';
    }

    return `assets/images/breeding/pokerus/${GameConstants.Pokerus[partyPokemon.pokerus]}.png`;
};

const getShadowStatusImage = (shadowStatus) => {
    if (shadowStatus == GameConstants.ShadowStatus.None) {
        return '//:0';
    }

    return `assets/images/status/${shadowStatus == GameConstants.ShadowStatus.Shadow ? 'shadow' : 'purified'}.svg`;
};

const exportPartyPokemon = () => {
    const headers = [
        '#', 'Pokemon', 'Type 1', 'Type 2', 'Shiny', 'Pokerus', 'Shadow Status', 'Native Region',
        'Attack', 'Base Breeding Eff', 'Breeding Eff', 'Obtained', 'Hatched',
        'Shiny Obtained', 'Shiny Hatched', 'Defeated', 'Effort Points',
        'EVs', 'EV Bonus'
    ];

    const data = getSortedPartyList().map((p) => [
        p.id,
        `"${p.name}"`,
        PokemonType[pokemonMap[p.id].type[0]],
        PokemonType[pokemonMap[p.id].type[1] ?? -1],
        p.shiny ? 1 : 0,
        p.pokerus,
        Companion.data.shadowPokemon.has(p.name) ? p.shadow : -1,
        GameConstants.camelCaseToString(GameConstants.Region[PokemonHelper.calcNativeRegion(p.name)]),
        p.totalAttack,
        p.baseBreedingEff,
        p.breedingEff,
        p.statistics.totalObtained,
        p.statistics.totalHatched,
        p.statistics.totalShinyObtained,
        p.statistics.totalShinyHatched,
        p.statistics.totalDefeated,
        p.effortPoints,
        p.evs(),
        p.calculateEVAttackBonus(),
    ]);

    Util.exportToCsv(headers, data, `PartyPokemon-${Date.now()}.csv`);
};

const getDungeonData = ko.pureComputed(() => {
    const dungeonData = [];
    const dungeonOverrides = Companion.data.DungeonListOverride.map(d => d.dungeons).flat();

    GameConstants.RegionDungeons.forEach((rd, idx) => {
        dungeonData.push({
            region: idx,
            dungeons: rd.filter(d => !dungeonOverrides.includes(d))
        });
    });

    Companion.data.DungeonListOverride.forEach((rd) => dungeonData.push({...rd}));

    dungeonData.forEach(d => {
        d.dungeons = d.dungeons.map(dungeon => {
            const clears = getDungeonClearCount(dungeon);
            const cost = dungeonList[dungeon].tokenCost;
            return {
                name: dungeon,
                clears: clears,
                cost: cost,
                remaining: Math.max((cost * 500) - (cost * clears), 0),
                hide: TownList[dungeon].requirements.some(req => req instanceof DevelopmentRequirement),
            };
        }).filter(d => !d.hide);
    });
    
    return dungeonData.filter(d => d.region <= GameConstants.MAX_AVAILABLE_REGION).sort((a, b) => a.region - b.region);
});

const getDungeonDataFlat = ko.pureComputed(() => getDungeonData().flatMap(d => d.dungeons));

const getDungeonClearCount = (dungeon) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const dungeonIndex = GameConstants.getDungeonIndex(dungeon);
    return SaveData.file().save.statistics.dungeonsCleared[dungeonIndex] || 0;
};

const totalDungeonClears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.clears, 0);
});

const totalDungeonTokensSpent = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.clears * dungeon.cost, 0);
});

const totalDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + (dungeon.cost * 500), 0);
});

const remainingDungeonCost500Clears = ko.pureComputed(() => {
    return getDungeonDataFlat().reduce((sum, dungeon) => sum + dungeon.remaining, 0);
});

const getMostClearedDungeons = ko.pureComputed(() => {
    return getDungeonDataFlat().sort((a, b) => b.clears - a.clears).slice(0, 5);
});

const getGymData = ko.pureComputed(() => {
    const gymList = [];

    GameConstants.RegionGyms.forEach((gyms, region) => {
        if (region > GameConstants.MAX_AVAILABLE_REGION) {
            return;
        }

        if (region == GameConstants.Region.alola) {
            gyms = gyms.filter(g => !g.endsWith(' Trial'));
        }

        gymList.push({
            region: region,
            gyms: gyms
        });
    });

    Companion.data.GymListOverride.forEach((g) => gymList.push({...g}));

    gymList.forEach(g => {
        g.gyms = g.gyms.map(gym => ({
            name: gym,
            clears: getGymClearCount(gym)
        }));
    });

    return gymList.sort((a, b) => a.region - b.region);
});

const getGymClearCount = (gym) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const gymIndex = GameConstants.getGymIndex(gym);
    return SaveData.file().save.statistics.gymsDefeated[gymIndex] || 0;
};

const getRouteData = ko.pureComputed(() => {
    const routeList = [];
    const routeOverrides = Companion.data.RouteListOverride;

    GameHelper.enumNumbers(GameConstants.Region).forEach(region => {
        if (region > GameConstants.MAX_AVAILABLE_REGION || region < 0) {
            return;
        }

        const regionRoutes = Routes.regionRoutes.filter(r => r.region == region);
        const routes = SubRegions.list[region].length == 1 ? regionRoutes
            : regionRoutes.filter(r => !routeOverrides.some(o => o.region === r.region && o.subRegion === r.subRegion));

        routeList.push({
            region: region,
            subRegion: 0,
            routes: routes
        });
    });

    routeOverrides.forEach((r) => routeList.push({...r}));

    routeList.forEach(r => {
        const regionName = GameConstants.camelCaseToString(GameConstants.Region[r.region]);
        r.routes.forEach(route => {
            route.routeName = route.routeName.replace(regionName, '').trim();
            route.defeats = getRouteDefeatCount(route.region, route.number);
        });
    });

    return routeList.sort((a, b) =>
        (a.displayRegion || a.region) - (b.displayRegion || b.region)
        || (a.displaySubRegion || a.subRegion) - (b.displaySubRegion || b.subRegion));
});

const getRouteDefeatCount = (region, routeNumber) => {
    if (!SaveData.isLoaded()) {
        return 0;
    }

    const regionName = GameConstants.Region[region];
    return SaveData.file().save.statistics.routeKills[regionName][routeNumber] || 0;
};

const hideOtherStatSection = (data) => {
    if (data.hidden) {
        return true;
    }

    const region = data.displayRegion ?? data.region;
    if (region > GameConstants.MAX_AVAILABLE_REGION) {
        return true;
    }

    if (!Companion.settings.showAllRegions() && Math.floor(region) > player.highestRegion()) {
        return true;
    }

    return false;
};

const getGMaxOrder = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const unlockableGMax = dungeonList["Max Lair"].bossList
        .filter(b => b.options?.requirement?.requirements?.some(r => r instanceof QuestLineStepCompletedRequirement && typeof r.questIndex === 'function'));
    const quests = App.game.quests.getQuestLine('The Lair of Giants').quests();

    const gmax = unlockableGMax.map(b => {
        const req = b.options.requirement.requirements.find(r => r instanceof QuestLineStepCompletedRequirement);
        const questStepIndex = req.questIndex();
        return {
            pokemon: b.name,
            questStep: questStepIndex,
            wishingPieces: quests[questStepIndex].amount,
        };
    }).sort((a, b) => a.questStep - b.questStep);

    // pikachu, meowth, eevee always first
    gmax.splice(0, 0, { pokemon: 'Gigantamax Pikachu' }, { pokemon: 'Gigantamax Meowth' }, { pokemon: 'Gigantamax Eevee' });

    // eternapants always last
    let name = 'Eternamax Eternatus';
    const monoType = SaveData.getMonoType(SaveData.file().save.party.caughtPokemon);
    if (monoType?.length == 1 && monoType[0] == PokemonType.Poison) {
        name = 'Eternapants Eternapantatus';
    }
    gmax.push({ pokemon: name });

    return gmax;
});

const typeDamageDistribution = ko.observable();
const includeXAttack = ko.observable(true);
const includeYellowFlute = ko.observable(true);
const includeGems = ko.observable(true);
const typeDamageWeather = ko.observable(WeatherType.Clear);
const typeDamageRegion = ko.observable(GameConstants.Region.none);

const calculateTypeDamageDistribution = () => {
    // load shit
    SaveData.loadAttackData();

    player.effectList['xAttack'](includeXAttack() ? 1 : 0);
    App.game.challenges.list.disableGems.active(!includeGems());
    if (includeYellowFlute() != FluteEffectRunner.isActive('Yellow_Flute')()) {
        FluteEffectRunner.toggleEffect('Yellow_Flute');
    }

    const ignoreRegionMultiplier = typeDamageRegion() == GameConstants.Region.none;

    const result = {};
    let max = 0;
    let min = Number.MAX_SAFE_INTEGER;

    for (let type1 = 0; type1 <= 17; ++type1) {
        result[PokemonType[type1]] = {};
        for (let type2 = 0; type2 <= 17; ++type2) {
            let dmg = App.game.party.calculatePokemonAttack(type1, type2, ignoreRegionMultiplier, typeDamageRegion(), true, false, typeDamageWeather(), true, true);
            result[PokemonType[type1]][PokemonType[type2]] = dmg.toLocaleString();
            max = Math.max(max, dmg);
            min = Math.min(min, dmg);
        }
    }

    typeDamageDistribution({
        distribution: result,
        max,
        min,
    });
};

const tabVisited = ko.observable({});
const activeTab = ko.observable('#mySaveContent');

$(document).ready(() => {
    const container = document.getElementById('container');
    ko.applyBindings({}, container);
    container.classList.remove('d-none');

    $('.btn-save-selector').click(() => {
        document.getElementById('file-selector').click();
    });

    $('#loadFromClipboard').click(() => {
        const data = $('#saveDataInput').val().trim();
        if (data.length) {
            SaveData.loadSaveData(atob(data));
            $('#loadFromClipboardModal').modal('hide');
        }
    });

    $('#loadFromClipboardModal').on('shown.bs.modal', () => {
        document.getElementById('saveDataInput').focus();
    });

    $(document).on('shown.bs.tab', 'button[data-bs-toggle="pill"]', (e) => {
        tabVisited({ ...tabVisited(), [$(e.target).data('bs-target')]: true });
    });

    $('#mainNavbar button.nav-link').on('show.bs.tab', (e) => {
        activeTab($(e.target).data('bs-target'));
    });

    $(document).on('click', '#partyPokemonTable thead th.sortable', (e) => {
        const sort = e.currentTarget.dataset.sort;
        if (pokemonStatTableSort() == sort) {
            pokemonStatTableSortDir(!pokemonStatTableSortDir());
        } else {
            pokemonStatTableSort(sort);
            pokemonStatTableSortDir(true);
        }
    });

    if (window.location.hash.includes('#!')) {
        const page = window.location.hash.replace(/.*#!/, '');
        page.split('/').forEach(s => {
            const tab = $(`button[data-bs-toggle="pill"][data-path="${decodeURIComponent(s)}"]`);
            if (tab.length) {
                tab.tab('show');
            }
        });
    }

    $(document).on('shown.bs.tab', 'button[data-bs-toggle="pill"]', () => {
        updateNavigationHash();
    });

    $(document).on('dragover', (event) => {
        event.preventDefault();
    });

    document.addEventListener('dragenter', (event) => {
        //$('#flex-container').addClass('drag-drop-border');
        //$('#drag-drop-overlay, #drag-drop-message').removeClass('d-none');
    });

    document.addEventListener('dragleave', (event) => {
        //$('#flex-container').removeClass('drag-drop-border');
        //$('#drag-drop-overlay, #drag-drop-message').addClass('d-none');
    });

    document.addEventListener('drop', (event) => {
        event.preventDefault();

        let files = [];
        if (event.dataTransfer.items) {
            files = [...event.dataTransfer.items].filter((item) => item.kind === 'file').map((item) => item.getAsFile());
        } else {
            files = [...event.dataTransfer.files];
        }

        const file = files.find((file) => file.name?.toLowerCase().endsWith('.txt'));
        if (file) {
            SaveData.loadFile(file);
        }
    });

    Companion.settings.initialize();
    SaveData.initialize();
    Forecast.generateForecasts();
    Forecast.generateDailySummary();

    Util.createNotifications();

    updateNavigationHash();
});

const updateNavigationHash = () => {
    const pages = [];
    $('button[data-bs-toggle="pill"].active:visible').each(function() {
        const path = $(this).data('path');
        if (path) {
            pages.push(path);
        }
    });

    if (pages.length) {
        window.history.replaceState(null, '', `#!${pages.join('/').replace(/\s+/g, '')}`);
    } else {
        window.history.replaceState(null, '', location.pathname);
    }
};

function compareBy(sortOption, direction) {
    return function (a, b) {
        let res, dir = direction ? -1 : 1;

        const aValue = getSortValue(sortOption, a);
        const bValue = getSortValue(sortOption, b);
        
        if (aValue == bValue) {
            return a.id - b.id;
        } else if (aValue < bValue) {
            res = -1;
        } else if (aValue > bValue) {
            res = 1;
        } else {
            res = 0;
        }

        return res * dir;
    }
}

function getSortValue(sortOption, partyPokemon) {
    switch (sortOption) {
        case 'name':
            return partyPokemon.name;
        case 'attack':
            return partyPokemon.totalAttack;
        case 'base-breeding-eff':
            return partyPokemon.baseBreedingEff;
        case 'breeding-eff':
            return partyPokemon.breedingEff;
        case 'obtained':
            return partyPokemon.statistics.totalObtained;
        case 'hatched':
            return partyPokemon.statistics.totalHatched;
        case 'shiny-obtained':
            return partyPokemon.statistics.totalShinyObtained;
        case 'shiny-hatched':
            return partyPokemon.statistics.totalShinyHatched;
        case 'defeated':
            return partyPokemon.statistics.totalDefeated;
        case 'evs':
            return partyPokemon.evs();
        case 'ev-bonus':
            return partyPokemon.calculateEVAttackBonus();
        case 'id':
        default:
            return partyPokemon.id;
    }
}

$(document).on('mouseover', '.table-column-row-hover tbody td', (e) => {
    const cell = e.target;
    $(cell).closest('tr').find('td').css('background-color', 'rgba(100, 100, 60, 0.1)');
    $(cell).closest('tbody').find(`td:nth-child(${cell.cellIndex + 1})`).css('background-color', 'rgba(100, 100, 60, 0.1)');
    cell.style.backgroundColor = 'rgba(100, 100, 60, 0.25)';
});

$(document).on('mouseout', '.table-column-row-hover tbody td', (e) => {
    const cell = e.target;
    $(cell).closest('tr').find('td').css('background-color', '');
    $(cell).closest('tbody').find(`td:nth-child(${cell.cellIndex + 1})`).css('background-color', '');
});

module.exports = {
    getMissingPokemon,
    getTotalMissingPokemonCount,
    getMissingRegionPokemonCount,

    partyList,
    getSortedPartyList,
    caughtPokemonCount,
    caughtShinyCount,
    caughtResistantCount,

    hideFromPokemonStatsTable,
    getPokemonStatsTableCount,
    pokemonStatTableSearch,
    pokemonStatTableFilter,
    isEventDiscordClientPokemon,

    isPokemonCaught,
    getCaughtPokeballImage,
    hasPokerus,
    getPokerusImage,
    getShadowStatusImage,
    exportPartyPokemon,

    getDungeonData,
    totalDungeonClears,
    totalDungeonTokensSpent,
    totalDungeonCost500Clears,
    remainingDungeonCost500Clears,
    getMostClearedDungeons,

    getGymData,
    getRouteData,
    hideOtherStatSection,

    getGMaxOrder,

    typeDamageDistribution,
    calculateTypeDamageDistribution,
    includeXAttack,
    includeYellowFlute,
    includeGems,
    typeDamageWeather,
    typeDamageRegion,

    tabVisited,
    activeTab,
};

},{}],37:[function(require,module,exports){
const settings = {
    xAttackEnabled: ko.observable(false),
    weather: ko.observable(WeatherType.Clear),
    hideCompleted: ko.observable(true),
    hideLocked: ko.observable(false),
    activeFlutes: ko.observableArray([]),
    allFlutesToggle: ko.observable(false),
};

settings.allFlutesToggle.subscribe((value) => {
    if (value) {
        settings.activeFlutes(Object.values(GameConstants.FluteItemType));
    } else {
        settings.activeFlutes([]);
    }
});

let regionMultiplierOverride = -1;

let baseGymList = undefined;
const gymList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    if (!baseGymList) {
        baseGymList = [];
        GameConstants.RegionGyms.forEach((gyms, region) => {
            if (region > GameConstants.MAX_AVAILABLE_REGION) {
                return;
            }
    
            if (region == GameConstants.Region.alola) {
                gyms = gyms.filter(g => !g.endsWith(' Trial'));
            }
    
            baseGymList.push({
                region: region,
                gyms: gyms
            });
        });

        Companion.data.GymListOverride.forEach((g) => baseGymList.push({...g}));
        baseGymList = baseGymList.sort((a, b) => a.region - b.region)
            .flatMap(rg => rg.gyms.map(g => {
                const gym = GymList[g];
                gym.region = rg.region;
                return gym;
            }));
    }

    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    const gymList = baseGymList.filter(g => {
        if (!Companion.settings.showAllRegions() && Math.floor(g.region) > player.highestRegion()) {
            return false;
        }

        if (g.region > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (settings.hideLocked() && !g.isUnlocked()) {
            return false;
        }

        if (settings.hideCompleted() && gymsDefeated[GameConstants.getGymIndex(g.town)] > 0) {
            return false;
        }

        return true;
    });

    return gymList;
});

const tempBattleList = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded()) {
        return [];
    }

    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;
    return Object.values(TemporaryBattleList).filter(tb => {
        if (!Companion.settings.showAllRegions() && tb.getTown().region > player.highestRegion()) {
            return false;
        }

        if (tb.getTown().region > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (settings.hideLocked() && !tb.isUnlocked()) {
            return false;
        }

        if (settings.hideCompleted() && temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0) {
            return false;
        }

        return true;
    });
});

const getBattleData = ko.pureComputed(() => {
    const battleData = {
        gyms: [],
        tempBattles: [],
    };

    if (!SaveData.isDamageLoaded()) {
        return battleData;
    }

    // xAttack
    player.effectList['xAttack'](settings.xAttackEnabled() ? 1 : 0);

    // Flutes
    Object.values(GameConstants.FluteItemType).forEach((flute) => {
        toggleFlute(flute, settings.activeFlutes().includes(flute));
    });

    damageCache.clear();
    const gymsDefeated = SaveData.file().save.statistics.gymsDefeated;
    const temporaryBattleDefeated = SaveData.file().save.statistics.temporaryBattleDefeated;

    // gyms
    const gymBattles = [...gymList()];
    gymBattles.forEach(g => {
        if (!g.pokemonList) {
            g.pokemonList = g.getPokemonList();
        }

        const town = TownList[g.parent?.name ?? g.town];
        g.townObj = town;

        regionMultiplierOverride = town.region;

        g.isCompleted = gymsDefeated[GameConstants.getGymIndex(g.town)] > 0;
        g.secondsToWin = 0;

        g.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0);
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            if (damage > 0) {
                g.secondsToWin += p.secondsToDefeat;
            }
        });

        if (g.secondsToWin == 0) {
            g.secondsToWin = Infinity;
        }
    });

    battleData.gyms = gymBattles;

    // temp battles
    const tempBattles = [...tempBattleList()];
    tempBattles.forEach(tb => {
        if (!tb.pokemonList) {
            tb.pokemonList = tb.getPokemonList();
        }

        const town = tb.getTown();
        regionMultiplierOverride = town.region;

        tb.isCompleted = temporaryBattleDefeated[GameConstants.getTemporaryBattlesIndex(tb.name)] > 0;
        tb.secondsToWin = 0;

        tb.pokemonList.forEach(p => {
            const damage = calcPokemonDamage(p.name, town.region, town.subRegion ?? 0);
            p.partyDamage = damage;
            p.secondsToDefeat = Math.max(1, Math.ceil(p.maxHealth / damage));
            if (damage > 0) {
                tb.secondsToWin += p.secondsToDefeat;
            }
        });

        if (tb.secondsToWin == 0) {
            tb.secondsToWin = Infinity;
        }
    });

    battleData.tempBattles = tempBattles;
    regionMultiplierOverride = -1;

    return battleData;
}).extend({ rateLimit: 50 });

const timeFluteEnabled = ko.pureComputed(() => {
    return settings.activeFlutes().includes('Time_Flute');
});

const getGymBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) {
        return GameConstants.GYM_TIME / 1000;
    }

    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.GYM_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

const getTempBattleTime = ko.pureComputed(() => {
    if (!SaveData.isDamageLoaded() || !timeFluteEnabled()) {
        return GameConstants.TEMP_BATTLE_TIME / 1000;
    }

    const fluteBonus = (ItemList["Time_Flute"].multiplyBy - 1) * (AchievementHandler.achievementBonus() + 1) + 1;
    const battleTime = GameConstants.TEMP_BATTLE_TIME * fluteBonus;
    return Math.ceil(battleTime / 100) / 10;
});

const damageCache = new Map();
const calcPokemonDamage = (pokemonName, battleRegion, battleSubRegion) => {
    const pokemon = pokemonMap[pokemonName];
    const type1 = pokemon.type[0];
    const type2 = pokemon.type[1] ?? PokemonType.None;

    let damageCacheKey = `${battleRegion}|${type1}|${type2}`;
    if (battleRegion == GameConstants.Region.alola && battleSubRegion == GameConstants.AlolaSubRegions.MagikarpJump) {
        damageCacheKey = `${damageCacheKey}|mkj`;
    }

    let damage = damageCache.get(damageCacheKey);
    if (damage === undefined) {
        damage = calcPartyAttack(type1, type2, battleRegion, settings.weather(), battleRegion, battleSubRegion);
        damageCache.set(damageCacheKey, damage);
    }

    return damage;
}

// slightly modified Party.calculatePokemonAttack() to allow overriding the player region
const calcPartyAttack = (type1, type2, region, weather, playerRegion = 0, playerSubRegion = 0) => {
    let attack = 0;
    for (const pokemon of App.game.party.caughtPokemon) {
        if (region == GameConstants.Region.alola && playerRegion == GameConstants.Region.alola && playerSubRegion == GameConstants.AlolaSubRegions.MagikarpJump
            && Math.floor(pokemon.id) != 129) {
            // Only magikarps can attack in magikarp jump
            continue;
        }
        attack += App.game.party.calculateOnePokemonAttack(pokemon, type1, type2, region, false, true, false, weather, false, true);
    }

    const bonus = App.game.party.multiplier.getBonus('pokemonAttack');
    return Math.round(attack * bonus);
};

// modified Party.getRegionAttackMultiplier
const getRegionAttackMultiplier = Party.prototype.getRegionAttackMultiplier;
Party.prototype.getRegionAttackMultiplier = () => {
    const region = Math.max(regionMultiplierOverride, player.highestRegion());
    return getRegionAttackMultiplier(region);
};

/*const toggleFlute = (flute) => {
    if (isFluteActive(flute)) {
        player.effectList[flute](0);
        player.itemList[flute](1);
    } else {
        player.itemList[flute](0);
        player.effectList[flute](1);
    }

    updateFluteActiveGemTypes();
};*/

const toggleFlute = (flute, active) => {
    if (active && !isFluteActive(flute)) {
        player.itemList[flute](0);
        player.effectList[flute](1);
        updateFluteActiveGemTypes();
    }

    if (!active && isFluteActive(flute)) {
        player.effectList[flute](0);
        player.itemList[flute](1);
        updateFluteActiveGemTypes();
    }
}

const isFluteActive = (flute) => {
    return !!player.effectList[flute]();
};

const updateFluteActiveGemTypes = () => {
    FluteEffectRunner.activeGemTypes.removeAll();
    const gemTypes = new Set();
    GameHelper.enumStrings(GameConstants.FluteItemType).forEach(flute => {
        if (isFluteActive(flute)) {
            ItemList[flute].gemTypes.forEach(idx => gemTypes.add(PokemonType[idx]));
        }
    });
    [...gemTypes].forEach(x => FluteEffectRunner.activeGemTypes.push(x));
};

const lol = Rand.intBetween(1, 20);
const formattedSecondsToWin = (secondsToWin) => {
    return lol == 1 && secondsToWin === Infinity ? 'hahaHAHAha' : secondsToWin.toLocaleString();
};

module.exports = {
    settings,
    getBattleData,
    getGymBattleTime,
    getTempBattleTime,
    formattedSecondsToWin,
};
},{}],38:[function(require,module,exports){
const UnobtainablePokemon = [
    'Mega Medicham',
    'Mega Altaria',
    'Arceus (Fire)',
    'Arceus (Water)',
    'Arceus (Electric)',
    'Arceus (Grass)',
    'Arceus (Ice)',
    'Arceus (Fighting)',
    'Arceus (Poison)',
    'Arceus (Ground)',
    'Arceus (Flying)',
    'Arceus (Psychic)',
    'Arceus (Bug)',
    'Arceus (Rock)',
    'Arceus (Ghost)',
    'Arceus (Dragon)',
    'Arceus (Dark)',
    'Arceus (Steel)',
    'Arceus (Fairy)',
    'Dugtrio (Punk)',
    'Weepinbell (Fancy)',
    'Gengar (Punk)',
    'Onix (Rocker)',
    'Tangela (Pom-pom)',
    'Goldeen (Diva)',
    'Pikachu (Rock Star)',
    'Pikachu (Belle)',
    'Pikachu (Pop Star)',
    'Pikachu (Ph. D.)',
    'Pikachu (Libre)',
    'Furfrou (Heart)',
];

const EventDiscordClientPokemon = [
    'Bulbasaur (Clone)',
    'Spooky Bulbasaur',
    'Bulbasaur (Rose)',
    'Ivysaur (Clone)',
    'Spooky Ivysaur',
    'Ivysaur (Rose)',
    'Venusaur (Clone)',
    'Spooky Venusaur',
    'Venusaur (Rose)',
    'Charmander (Clone)',
    'Charmeleon (Clone)',
    'Charizard (Clone)',
    'Squirtle (Clone)',
    'Wartortle (Clone)',
    'Blastoise (Clone)',
    'Pikachu (Clone)',
    'Pikachu (Easter)',
    'Red Spearow',
    'Flying Pikachu',
    'Surfing Pikachu',
    'Pikachu (Gengar)',
    'Let\'s Go Pikachu',
    'Charity Chansey',
    'Santa Jynx',
    'Let\'s Go Eevee',
    'Santa Snorlax',
    'Snorlax (Snowman)',
    'Armored Mewtwo',
    'Spooky Togepi',
    'Togepi (Flowering Crown)',
    'Spooky Togetic',
    'Reindeer Stantler',
    'Blessing Blissey',
    'Grinch Celebi',
    'Torchic (Egg)',
    'Handout Happiny',
    'Elf Munchlax',
    'Spooky Togekiss',
    'Rotom (Discord)',
    'Vivillon (Fancy)',
];

const pokemonRegionOverride = {

    // Magikarp
    ...Object.fromEntries(
        pokemonList.filter(p => Math.floor(p.id) == 129 && p.id > 129).map(p => [p.name, GameConstants.Region.alola])
    ),
    'Magikarp (Feebas)': GameConstants.Region.hoenn,

    // Pikachu
    ...Object.fromEntries(
        pokemonList.filter(p => Math.floor(p.id) == 25 && p.id > 25).map(p => [p.name, GameConstants.Region.alola])
    ),
    'Pikachu (Palaeontologist)': GameConstants.Region.kanto,
    'Detective Pikachu': GameConstants.Region.kalos,
    'Detective Raichu': GameConstants.Region.kalos,
    'Pikachu (World Cap)': GameConstants.Region.galar,

    // Valencian and Pinkan
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Pinkan ') || p.name.startsWith('Valencian '))
            .map(p => [p.name, GameConstants.Region.hoenn])
    ),
    'Pink Butterfree': GameConstants.Region.hoenn,
    "Ash's Butterfree": GameConstants.Region.hoenn,
    'Pinkan Pikachu': GameConstants.Region.hoenn,
    'Crystal Onix': GameConstants.Region.hoenn,
    'Crystal Steelix': GameConstants.Region.hoenn,

    // Mega and Primal
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Mega ') || p.name.startsWith('Primal '))
            .map(p => [p.name, GameConstants.Region.kalos])
    ),

    // Gigantamax
    ...Object.fromEntries(
        pokemonList.filter(p => p.name.startsWith('Gigantamax ') || p.name.startsWith('Eternamax'))
            .map(p => [p.name, GameConstants.Region.galar])
    ),

    'Meowth (Phanpy)': GameConstants.Region.johto,
    'Unown (E)': GameConstants.Region.sinnoh,
    'Unown (!)': GameConstants.Region.hoenn,
    'Unown (?)': GameConstants.Region.hoenn,
    'XD001': GameConstants.Region.unova,
    'Hoppip (Chimecho)': GameConstants.Region.hoenn,
    'Meltan': GameConstants.Region.alola,
    'Melmetal': GameConstants.Region.alola,
    'Ditto (Magikarp)': GameConstants.Region.alola,
    'Flowering Celebi': GameConstants.Region.galar,
    'Magearna (Original Color)': GameConstants.Region.galar,

    // Event / Discord / Client
    ...Object.fromEntries(EventDiscordClientPokemon.map(p => [p, -2]))
}

const DungeonListOverride = [
    {
        region: 0.1,
        name: 'Sevii Islands 123',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.kanto
                    && t.subRegion == GameConstants.KantoSubRegions.Sevii123
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ]
    },
    {
        region: 2.1,
        name: 'Sevii Islands 4567',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.kanto
                    && t.subRegion == GameConstants.KantoSubRegions.Sevii4567
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ]
    },
    {
        region: 2.2,
        name: 'Orre',
        dungeons: [
            ...Object.values(TownList)
                .filter(t => t.region == GameConstants.Region.hoenn
                    && t.subRegion == GameConstants.HoennSubRegions.Orre
                    && t instanceof DungeonTown)
                .map(t => t.name)
        ],
    },
];

const GymListOverride = [
    {
        region: 2.1,
        name: 'Orange League',
        gyms: [ ...GameConstants.OrangeGyms ]
    },
    {
        region: 2.2,
        name: 'Orre',
        gyms: [
            ...GameConstants.OrreGyms
                .filter(gym => !GymList[gym].requirements.some((req) => req instanceof DevelopmentRequirement))
        ],
    },
    {
        region: 6.1,
        name: 'Magikarp Jump',
        gyms: [ ...GameConstants.MagikarpJumpGyms ]
    }
];

const RouteListOverride = [
    {
        region: 0,
        subRegion: 1,
        name: 'Sevii Islands 123',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.kanto
            && r.subRegion == GameConstants.KantoSubRegions.Sevii123)
    },
    {
        region: 0,
        displayRegion: 2,
        subRegion: 2,
        name: 'Sevii Islands 4567',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.kanto
            && r.subRegion == GameConstants.KantoSubRegions.Sevii4567)
    },
    {
        region: 2,
        subRegion: 1,
        displaySubRegion: 2,
        name: 'Orre',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.hoenn
            && r.subRegion == GameConstants.HoennSubRegions.Orre)
    },
    {
        region: 6,
        subRegion: 4,
        name: 'Magikarp Jump',
        routes: Routes.regionRoutes.filter(r => r.region == GameConstants.Region.alola
            && r.subRegion == GameConstants.AlolaSubRegions.MagikarpJump)
    }
];

const obtainablePokemonList = (() => {
    const unobtainableList = UnobtainablePokemon.filter(p => typeof p === 'string');
    const unobtainableListRegex = UnobtainablePokemon.filter(p => typeof p === 'object').map(p => new RegExp(p));

    const pokemon = pokemonList.filter(p => {
        if (p.id < 1) {
            return false;
        }

        if (PokemonHelper.calcNativeRegion(p.name) > GameConstants.MAX_AVAILABLE_REGION) {
            return false;
        }

        if (unobtainableList.includes(p.name) || unobtainableListRegex.some(r => r.test(p.name))) {
            return false;
        }

        return true;
    }).map(p => {
        p.nativeRegion = PokemonHelper.calcNativeRegion(p.name);
        p.obtainRegion = pokemonRegionOverride[p.name] || p.nativeRegion;

        return p;
    });

    return pokemon;
})();

const obtainablePokemonMap = obtainablePokemonList.reduce((map, p) => { map[p.id] = p; return map; }, {});

const shadowPokemon = (() => {
    const dungeons = Object.values(TownList)
        .filter(t => t.region == GameConstants.Region.hoenn
            && t.subRegion == GameConstants.HoennSubRegions.Orre
            && t instanceof DungeonTown
            && !t.requirements.some(req => req instanceof DevelopmentRequirement))
        .map(t => t.dungeon);

    const pokemon = [];
    dungeons.forEach(d => {
        d.enemyList.forEach(enemy => {
            if (enemy instanceof DungeonTrainer) {
                pokemon.push(...enemy.getTeam().filter(p => p.shadow == GameConstants.ShadowStatus.Shadow).map(p => p.name));
            }
        });
        d.bossList.forEach(boss => {
            if (boss instanceof DungeonTrainer) {
                pokemon.push(...boss.getTeam().filter(p => p.shadow == GameConstants.ShadowStatus.Shadow).map(p => p.name));
            }
        });
    });

    return new Set(pokemon);
})();

const validRegions = GameHelper.enumNumbers(GameConstants.Region).filter(region => region > GameConstants.Region.none && region <= GameConstants.MAX_AVAILABLE_REGION);
const validRegionNames = validRegions.map(region => GameConstants.camelCaseToString(GameConstants.Region[region]));
const roamerGroups =
    RoamingPokemonList.roamerGroups.map((rg, ri) => rg.map((sr, si) => ({ name: sr.name, region: ri, subRegionGroup: si })))
        .flat().filter((rg) => rg.region <= GameConstants.MAX_AVAILABLE_REGION);
const unownDungeonList = ['Ruins of Alph', 'Tanoby Ruins', 'Solaceon Ruins'];
const unownList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!?'.split('');
const berryMasterPokemonLocations = [GameConstants.BerryTraderLocations['Pinkan Pokémon Reserve'], GameConstants.BerryTraderLocations['Secret Berry Shop']];
const berryMasterPokemonCosts = {
    [GameConstants.BerryTraderLocations['Pinkan Pokémon Reserve']]: [
        { pokemon: 'Pinkan Arbok', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Oddish', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Poliwhirl', minCost: 40, maxCost: 60 },
        { pokemon: 'Pinkan Geodude', minCost: 20, maxCost: 40 },
        { pokemon: 'Pinkan Weezing', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Scyther', minCost: 80, maxCost: 100 },
        { pokemon: 'Pinkan Electabuzz', minCost: 80, maxCost: 100 }
    ],
    [GameConstants.BerryTraderLocations['Secret Berry Shop']]: [
        { pokemon: 'Grotle (Acorn)', minCost: 80, maxCost: 100 }
    ]
};

module.exports = {
    UnobtainablePokemon,
    EventDiscordClientPokemon,

    pokemonRegionOverride,

    DungeonListOverride,
    GymListOverride,
    RouteListOverride,

    obtainablePokemonList,
    obtainablePokemonMap,
    shadowPokemon,
    validRegions,
    validRegionNames,
    roamerGroups,
    unownDungeonList,
    unownList,
    berryMasterPokemonLocations,
    berryMasterPokemonCosts,
}
},{}],39:[function(require,module,exports){
const revealHintsCounter = ko.observable(0);
const revealHints = ko.pureComputed(() => revealHintsCounter() > 4);

const buttonTextList = [
    'Reveal Required Berries (may result in being judged)',
    'Are you SURE!?',
    'No, really, are you ABSOLUTELY SURE??',
    'Just get the hints normally, man.',
    'Fine. Have it your way >:(',
];

const buttonText = ko.pureComputed(() => buttonTextList[revealHintsCounter()] || '...');

const revealHintsButtonClick = () => revealHintsCounter(revealHintsCounter() + 1);

const getBerries = ko.pureComputed(() => {
    const berries = ['North', 'West', 'East', 'South'].map(d => ({ direction: d, berry: undefined }));
    if (!SaveData.isLoaded()) {
        return berries;
    }

    const enigmaMutationIdx = App.game.farming.mutations.findIndex(m => m.mutatedBerry == BerryType.Enigma);
    const hintsSeen = SaveData.file().save.farming.mutations[enigmaMutationIdx];

    for (let i = 0; i < berries.length; i++) {
        if (hintsSeen[i] || revealHints()) {
            berries[i].berry = BerryType[EnigmaMutation.getReqs()[i]];
        }
    }

    return berries;
});

module.exports = {
    revealHintsCounter,
    revealHints,
    buttonText,
    revealHintsButtonClick,
    getBerries,
};
},{}],40:[function(require,module,exports){
const unownForecast = ko.observableArray();
const weatherForecast = ko.observableArray();
const boostedRoutes = ko.observableArray();
const berryMasters = ko.observableArray();
//const dailyDeals = ko.observableArray();
const enigmaDirection = ko.observableArray();

const summaryDate = ko.observable(new Date());
const summary = ko.observable({
    unown: [],
    weather: [],
    boostedRoutes: [],
    berryTrades: [],
    //dailyDeals: [],
    islandScan: {},
});

const generateForecasts = (date = new Date()) => {
    const currentHour = date.getHours();
    const unownData = [];
    const weatherData = [];
    const boostedRouteData = [];
    const berryMasterData = [];
    //const dailyDealData = [];

    for (let day = 0; day < 365; day++) {
        const saveDate = new Date(date);

        // Unown
        unownData.push({
            startDate: saveDate,
            unowns: getUnownByDate(date),
        });

        // Berry Masters
        berryMasterData.push({
            date: saveDate,
            traderDeals: getBerryDealsByDate(date),
        });

        // Daily Deals
        /*dailyDealData.push({
            date: saveDate,
            deals: getDailyDealsByDate(date),
        });*/

        // Weather
        weatherData.push(...getRegionalWeatherByDate(date));

        // Boosted Routes
        // only generate a few days worth
        if (boostedRouteData.length < 9) {
            boostedRouteData.push(...getBoostedRoutesByDate(date));
        }

        // Enigma Direction
        enigmaDirection.push({
            date: saveDate,
            direction: getEnigmaDirectionByDate(date),
        });

        date.setDate(date.getDate() + 1);
    }

    // Remove past data
    weatherData.splice(0, Math.floor(currentHour / Weather.period));
    boostedRouteData.splice(0, Math.floor(currentHour / RoamingPokemonList.period));

    unownForecast(unownData);
    weatherForecast(weatherData);
    boostedRoutes(boostedRouteData.slice(0, 6));
    berryMasters(berryMasterData);
    //dailyDeals(dailyDealData);
};

const generateDailySummary = (date = new Date()) => {
    summaryDate(new Date(date));
    summary({
        unown: getUnownByDate(date),
        weather: getRegionalWeatherByDate(date),
        boostedRoutes: getBoostedRoutesByDate(date),
        berryTrades: getBerryDealsByDate(date),
        //dailyDeals: getDailyDealsByDate(date),
        islandScan: getIslandScanPokemonByDate(date),
    });
};

const getUnownByDate = (date = new Date()) => {
    SeededDateRand.seedWithDate(date);
    return [
        SeededDateRand.fromArray(AlphUnownList),
        SeededDateRand.fromArray(TanobyUnownList),
        SeededDateRand.fromArray(SolaceonUnownList),
    ];
};

const getBerryDealsByDate = (date = new Date()) => {
    BerryDeal.generateDeals(date);
    return Object.values(BerryDeal.list).map((d) => [...d()]);
};

/*const getDailyDealsByDate = (date = new Date()) => {
    DailyDeal.generateDeals(5, date);
    return [...DailyDeal.list()];
};*/

const getRegionalWeatherByDate = (date = new Date()) => {
    const weatherData = [];
    for (let hour = 0; hour <= 23; hour += Weather.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        const weather = { startDate: hourDate, regionalWeather: {} };
        for (let region = GameConstants.Region.kanto; region <= GameConstants.MAX_AVAILABLE_REGION; region++) {
            weather.regionalWeather[region] = Weather.getWeather(region, hourDate);
        }
        weatherData.push(weather);
    }
    return weatherData;
};

const getBoostedRoutesByDate = (date = new Date()) => {
    const routeData = [];
    for (let hour = 0; hour <= 23; hour += RoamingPokemonList.period) {
        const hourDate = new Date(date.setHours(hour, 0, 0, 0));
        RoamingPokemonList.generateIncreasedChanceRoutes(hourDate);

        const boostedRoute = { startDate: hourDate, regionalRoutes: [] };
        Companion.data.roamerGroups.forEach((rg) => {
            const route = RoamingPokemonList.getIncreasedChanceRouteBySubRegionGroup(rg.region, rg.subRegionGroup)();
            boostedRoute.regionalRoutes.push(route.routeName.replace('Route ', ''));
        });

        routeData.push(boostedRoute);
    }
    return routeData;
};

const getEnigmaDirectionByDate = (date = new Date()) => {
    SeededRand.seedWithDate(date);
    return directionFromIndex(SeededRand.floor(4));
};

const directionFromIndex = (index) => {
    switch (index) {
        case 0:
            return 'North';
        case 1:
            return 'West';
        case 2:
            return 'East';
        case 3:
            return 'South';
    }
}

const getUpcomingWeather = () => {
    const dayForecast = weatherForecast.slice(0, 18).reduce((map, wf) => {
        const date = Util.formatDate(wf.startDate);
        map[date] = map[date] || [];
        map[date].push(wf);
        return map;
    }, {});

    return Object.entries(dayForecast).map(([date, forecast]) => ({ date, forecast }));
};

const getNextWeatherDate = (region, weather) => {
    return weatherForecast().find(wf => wf.regionalWeather[region] === weather)?.startDate;
};

const getBerryMasterDeals = (berryTrader, days = undefined) => {
    const deals = days != undefined ? berryMasters().slice(0, days) : berryMasters();
    return deals.map(d => ({ date: d.date, deals: d.traderDeals[berryTrader] }));
};

const getBerryMasterNextItemDate = (berryTrader) => {
    const items = {};

    getBerryMasterDeals(berryTrader).forEach((t) => t.deals.forEach((d) => {
        const itemName = d.item.itemType.name;
        if (!items[itemName]) {
            items[itemName] = {
                date: t.date,
                item: d.item.itemType._displayName || itemName,
                amount: d.item.amount,
                berries: d.berries
            };
        }
    }));

    return Object.values(items).sort((a, b) => a.item.localeCompare(b.item));
};

const getBerryMasterPokemonMinMaxCost = (berryTrader) => {
    const pokemonList = [...Companion.data.berryMasterPokemonCosts[berryTrader]];
    pokemonList.forEach((p) => {
        p.minDate = getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.minCost),
        p.maxDate = getBerryMasterNextPokemonCost(berryTrader, p.pokemon, p.maxCost)
    });

    return pokemonList;
};

const getBerryMasterNextPokemonCost = (berryTrader, pokemonName, cost) => {
    return getBerryMasterDeals(berryTrader).find(t => t.deals.find(d => d.item.itemType.name == pokemonName && d.berries[0].amount == cost))?.date;
};

/*const getUndergroundItemList = () => {
    return UndergroundItems.list
        .filter(i => i.valueType !== UndergroundItemValueType.MegaStone)
        .map(i => i.name)
        .sort((a, b) => a.localeCompare(b))
};

const getNextOccurrenceUndergroundItems = () => {
    const items = getUndergroundItemList().reduce((a, v) => ({ ...a, [v]: {} }), {});
    dailyDeals().forEach((d) => d.deals.forEach((deal) => {
        if (!items[deal.item1.name].give) {
            items[deal.item1.name].give = {
                date: d.date,
                ...deal
            };
        }

        if (!items[deal.item2.name].receive) {
            items[deal.item2.name].receive = {
                date: d.date,
                ...deal
            };
        }
    }));

    return items;
};

const selectedDailyDealItemNextTrades = ko.pureComputed(() => {
    const item = selectedDailyDealItem();
    if (!item) {
        return [];
    }

    return findNextTradesForItem(item);
});

const findNextTradesForItem = (itemName, days = 1095) => {
    if (!itemName) {
        return [];
    }

    const date = new Date();
    const deals = [];
    for (let i = 0; i < days; i++) {
        DailyDeal.generateDeals(5, date);
        const saveDate = new Date(date);
        deals.push(
            ...DailyDeal.list()
                .filter((deal) => deal.item1.name == itemName || deal.item2.name == itemName)
                .map((deal) => ({ date: saveDate, ...deal }))
        );
        date.setDate(date.getDate() + 1);
    }

    return deals;
};*/

const getIslandScanPokemonByDate = (date = new Date()) => {
    const data = { route: [], dungeon: [] };

    for (const route of Routes.getRoutesByRegion(GameConstants.Region.alola)) {
        const special = route.pokemon.special.filter(s => s.req instanceof DayOfWeekRequirement && s.req.DayOfWeekNum == date.getDay());
        if (special.length) {
            data.route.push({
                name: route.routeName,
                pokemon: special.flatMap(s => s.pokemon),
            });
        }
    }

    GameConstants.RegionDungeons[GameConstants.Region.alola].forEach((name) => {
        const dungeon = dungeonList[name];
        const pokemon = [];

        const enemies = dungeon.enemyList.filter(e => typeof e === 'object'
            && e.options.requirement instanceof DayOfWeekRequirement
            && e.options.requirement.DayOfWeekNum == date.getDay());

        if (enemies.length) {
            pokemon.push(...enemies.flatMap(e => e.pokemon));
        }

        const bosses = dungeon.bossList.filter(b =>
            b.options?.requirement instanceof DayOfWeekRequirement
            && b.options.requirement.DayOfWeekNum == date.getDay());

        if (bosses.length) {
            pokemon.push(...bosses.flatMap(b => b.name));
        }

        if (pokemon.length) {
            data.dungeon.push({
                name: name,
                pokemon: pokemon,
            })
        }
    });

    return data;
};

//const selectedDailyDealItem = ko.observable();

module.exports = {
    unownForecast,
    weatherForecast,
    boostedRoutes,
    berryMasters,
    //dailyDeals,
    enigmaDirection,
    summary,
    summaryDate,

    //selectedDailyDealItem,
    //selectedDailyDealItemNextTrades,

    generateForecasts,
    generateDailySummary,
    getUpcomingWeather,
    getNextWeatherDate,
    getBerryMasterDeals,
    getBerryMasterNextItemDate,
    getBerryMasterPokemonMinMaxCost,
    //getUndergroundItemList,
    //getNextOccurrenceUndergroundItems,
    getIslandScanPokemonByDate,
};
},{}],41:[function(require,module,exports){
const allSafariPokemon = ko.pureComputed(() => {
    // List isn't needed until a save is loaded
    if (!SaveData.isLoaded()) {
        return [];
    }

    return pokemonList
        .filter((p) => PokemonLocations.isObtainableAndNotEvable(p.name)
            && PokemonHelper.calcNativeRegion(p.name) <= GameConstants.MAX_AVAILABLE_REGION)
        .map((p) => p.name);
});

const getRotation = ko.pureComputed(() => {
    if (!SaveData.isLoaded()) {
        return [];
    }

    const rotationSize = GameConstants.FRIEND_SAFARI_POKEMON;
    const trainerId = SaveData.file().player.trainerId || '000000';
    SeededRand.seed(+trainerId);
    const shuffledPokemon = new Array(rotationSize).fill(SeededRand.shuffleArray(allSafariPokemon())).flat();

    const batchCount = Math.ceil(shuffledPokemon.length / rotationSize);
    const date = new Date();
    let startIndex = (Math.floor((date.getTime() - date.getTimezoneOffset() * 60 * 1000) / (24 * 60 * 60 * 1000)) % batchCount) * rotationSize;

    const data = [];
    for (let i = 0; i < Math.ceil(allSafariPokemon().length / rotationSize); i++) {
        data.push({
            date: new Date(date),
            pokemon: shuffledPokemon.slice(startIndex, startIndex + rotationSize)
        });
        startIndex += rotationSize;
        if (startIndex >= shuffledPokemon.length) {
            startIndex = 0;
        }
        date.setDate(date.getDate() + 1);
    }

    return data;
});

const isInRotation = (pokemonName) => {
    return allSafariPokemon().includes(pokemonName);
};

const pokemonCount = () => allSafariPokemon().length;

module.exports = {
    getRotation,
    isInRotation,
    pokemonCount,
};
},{}],42:[function(require,module,exports){
Notifier.notify = () => {};
SortModules = () => {};

const initGame = () => {
  player = new Player();
  player.highestRegion(0);
  const multiplier = new Multiplier();
  App.game = new Game(
    new Update(),
    new Profile(),
    new Breeding(multiplier),
    new Pokeballs(),
    new PokeballFilters(),
    new Wallet(multiplier),
    new KeyItems(),
    new BadgeCase(),
    new OakItems([20, 50, 100], multiplier),
    new OakItemLoadouts(),
    new PokemonCategories(),
    new Party(multiplier),
    new Gems(),
    new Underground(),
    new Farming(multiplier),
    new LogBook(),
    new RedeemableCodes(),
    new Statistics(),
    new Quests(),
    new SpecialEvents(),
    new Discord(),
    new AchievementTracker(),
    new Challenges(),
    new BattleFrontier(),
    multiplier,
    new SaveReminder(),
    new BattleCafeSaveObject(),
    new DreamOrbController(),
    new PurifyChamber(),
    new WeatherApp(),
    new ZMoves(),
  );
  App.game.farming.initialize();
  App.game.breeding.initialize();
  App.game.pokeballs.initialize();
  App.game.keyItems.initialize();
  App.game.oakItems.initialize();
  App.game.underground.initialize();
  App.game.farming.initialize();

  QuestLineHelper.loadQuestLines();

  // optimizations
  App.game.badgeCase.maxLevel.extend({ deferred: true });
};

initGame();

AchievementHandler.initialize(App.game.multiplier, App.game.challenges);
SafariPokemonList.generateSafariLists();

// Knockout tooltip bindings
ko.bindingHandlers.tooltip = {
  init: (element, valueAccessor) => {
      const local = ko.utils.unwrapObservable(valueAccessor()), options = {};

      ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
      ko.utils.extend(options, local);

      $(element).tooltip(options);

      ko.utils.domNodeDisposal.addDisposeCallback(element, () => {
          $(element).tooltip('dispose');
      });
  },
  'update': function (element, valueAccessor) {
    const local = ko.utils.unwrapObservable(valueAccessor());
    const options = {};

    ko.utils.extend(options, ko.bindingHandlers.tooltip.options);
    ko.utils.extend(options, local);

    // Update the config of the tooltip
    const tooltipData = bootstrap.Tooltip.getInstance(element);
    tooltipData._config.title = options.title;

    // If the tooltip is visible, update its text
    const tooltipInner = tooltipData.tip && tooltipData.tip.querySelector('.tooltip-inner');
    if (tooltipInner) {
        tooltipInner.innerHTML = tooltipData._config.title || '';
    }
    if (tooltipData && tooltipData._config) {
        if (tooltipData._config.title === '') {
            $(element).tooltip('hide');
        }
    }
  }
};

module.exports = {
  initGame,
};
},{}],43:[function(require,module,exports){
const package = require('../pokeclicker/package.json');

window.Companion = {
    package,
    ...require('./game'),
    ...require('./app'),
    data: require('./data'),
    settings: require('./settings'),
}

Object.assign(window, {
    SaveData: require('./save'),
    Forecast: require('./forecast'),
    VitaminTracker: require('./vitaminTracker'),
    Enigma: require('./enigma'),
    FriendSafari: require('./friendSafari'),
    SaveFixes: require('./saveFixes'),
    BattleCalculator: require('./battleCalculator'),
    Util: require('./util'),
});

},{"../pokeclicker/package.json":35,"./app":36,"./battleCalculator":37,"./data":38,"./enigma":39,"./forecast":40,"./friendSafari":41,"./game":42,"./save":44,"./saveFixes":45,"./settings":46,"./util":47,"./vitaminTracker":48}],44:[function(require,module,exports){
const file = ko.observable();
const prevLoadedSaves = ko.observableArray();
const isDamageLoaded = ko.observable(false);

const loadFile = (file) => {
    const fileName = file.name;
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
        loadSaveData(atob(fileReader.result), fileName);
    });

    fileReader.readAsText(file);
};

const loadSaveData = (saveString, fileName = null) => {
    const saveFile = JSON.parse(saveString);

    if (file() !== undefined) {
        Companion.initGame();
    }

    player.highestRegion(saveFile.player.highestRegion);
    player.trainerId = saveFile.player.trainerId;
    App.game.challenges.list.slowEVs.active(saveFile.save.challenges.list.slowEVs);

    Enigma.revealHintsCounter(0);
    VitaminTracker.highestRegion(player.highestRegion());
    Companion.typeDamageDistribution(undefined);
    isDamageLoaded(false);

    file(saveFile);

    if (fileName) {
        const prevDataIndex = prevLoadedSaves().findIndex((save) => save.name == fileName);
        if (prevDataIndex > 0) {
            prevLoadedSaves.unshift(prevLoadedSaves.splice(prevDataIndex, 1)[0]);
        } else if (prevDataIndex == -1) {
            const compressed = Util.compressString(saveString);
            const arr = prevLoadedSaves();
            arr.unshift({ name: fileName, data: compressed });
            arr.length = Math.min(arr.length, 5);
            prevLoadedSaves(arr);
        }
    }

    if (!saveFile.save.party.caughtPokemon?.length) {
        Util.notify({
            message: 'Why don\'t you come back after catching some pokémon? Not a very good trainer, this one.',
            type: 'danger',
            timeout: 30000
        });
    }

    const monoType = getMonoType(saveFile.save.party.caughtPokemon);
    if (monoType) {
        Util.notify({
            message: `Haha, look, they only have ${monoType.map(t => PokemonType[t]).join('/')} pokémon!`,
            type: 'danger',
            timeout: 30000
        });
    }

    if (saveFile.save.profile.name.toLowerCase() == 'bailey') {
        let msg;
        if (Rand.intBetween(1, 20) == 1) {
            msg = 'Ȟ̷̨̠͈͖̲̠͍͓̊͂̐e̵͈͖̮̼̼͚͍̳̠̖̺͚̓͝ĺ̷̢̧̧̻̫͚̒l̴̛̲̼͒̽́͒̆̑͑̃̌̎o̸̡̘̞̝̭̙̠̰͋̆̚.̵̡̛̹͙̤̺̳̱͚̹̏͌̓̓̌̿̊̒́͂̂̊͂̚ ̵̨̨̖̭̞̰͖̞̮͚̺̟̰̔B̴̢̰̳͓̬̤̯̬͍̙͎̟͉͓̙̓̈́̓̽͑̍̓̂͑́͘͘a̵̛̭̬͎̪̔͋͌̀͂̏i̷̱͉̪͖̫͇̮͔̯͆̄̔͋͂ḽ̵̳͕͆̎̈́ę̶̛͕̘͎̮̯͙̱͔̙͓͉̿̽̍͂̋̇̏̐̈̽͜y̷̡̟̦̓̍͐̓̆̀̍̂̕.̶̤͖͚̅̅̒̔͘͘ ̴̧̤͔̜̪̦͇̿̀̋͒̾̋͋̚W̸̨̜͍̲̖̱̯̖͇̣̩̉̏͘͘͘͜͝͝e̴̛̩͈̥̻̺̝̲̹͂̈́̉͆̀̀͊́͐.̶̢̱͙̱̱͈͖̳̫̝͇̰̐̏̀̂̎̇͋͛͛̇̉͐́̚̕ͅͅ ̸̙̩̥͕̪̖̅̆̓̏̕͝͝͝ͅS̸̙͈̺͙̟͓̠̼͍͖̭͇͂̍̊͂̎̃̂͜e̸̟͊́̈́͆̉̽̎̔̈̊̔̑̕̕̚e̷̛̯̼̱͐͊͒̈́́̽͐̏̉̔.̴̧̛̉̈̊͛͐ ̶̨͕̗̱̙͚̗̩͉̖̥͈̠̬̑̉̀Ỹ̷̡͖̪̝̦͈̲͘͝o̵̢͍̗͍̱̪̮̊͛͛͋̂̆̔̒͊́̈͂̾̋ͅû̶̹̳̽͌̊̌̓̑͝.̶̡̢̹̤͚͚̟͇͕͖̦̠̪͆̍̈̉̉̈́͆̑̎̆͘̚͝ ̶̙͈͋̾͊̆̒̌͐̂Ŵ̸̧̺̗̥̲͈̳̟̜͚̜͚̏̽͗̊̾̐̿̉͝ȩ̵̼̪͎͉͇͙̭͎̻͈͗̈́͂̓̈́̒̃̈̔̋̉̂̈̕ͅ.̷̤͔͕̎̎̐̂͆̈́̀ ̸̢̧̻̗̯̥͓̥͕̱̖̬̲̅́̒͌̿̎̔͌̈͌̀͠͠ͅͅÂ̸̛̛̖͕̱̫̲̞̯̫͉͖̻̳͂̂̅̈́̑̓́͐̈̀r̷̢̗̳̗̤͔͓̻̳̳̠̳̬̩̞̆̎̾̈́͋̊̕͝e̴͓͇͙̬͔̼͔͇̋̋̐̐̽͐̈́͘̚.̸͍̞̼͈̖̩̮̹̈́̊̄͠ ̴͓͔̬̟̈́̈W̵͍͍̼̜̤͔̭̻̞̫̹̎̇̿́̀͘ͅa̷̡̡̨̩̙͍͖̜̍̾̈́͊̽̂͂͜t̵̟͚͙͇̫͚̠̭͈̣̘̫͆͒̑͊̀͒̆̉́͑͋̊̕͘ͅç̶̮͉͍̫̋̅̅̓͑͠ḩ̷͕̟̠̩̼̼͓̜̳̦͝ĭ̵̧̢̨̼͓̩͈̮͖͖͓̰͕̈́̈́͂̋̅̐̍̔̎̀́̕n̸̛͚͕̝̐́̿͌͂̊͛̓̂̓̓͑͋͝g̸̞̠̭͖̯̲͕̫̗͖͔͙̀̿̇͜.̸̨̡̢̱͖͙̰͍͙̟͈͓̪͙͊̓̆̃́̀̀̈́';
        } else {
            const hour = (new Date()).getHours();
            if (hour < 5) {
                msg = 'Bailey! What are you still doing up!? GO TO BED!';
            } else if (hour < 12) {
                msg = 'Good morning, Bailey! Did you sleep well?';
            } else if (hour < 18) {
                msg = 'Good afternoon, Bailey! We missed you. Enjoy your stay.';
            } else if (hour < 22) {
                msg = 'Good evening, Bailey. How was your day?';
            } else {
                msg = 'Hello, Bailey. It\'s getting kind of late, perhaps consider retiring to bed soon?';
            }
        }
        if (msg) {
            Util.notify({
                message: msg,
                type: 'danger',
                timeout: 30000
            });
        }
    }

    bananaCheck(saveFile);
};

const getMonoType = (party) => {
    if (!party?.length) {
        return undefined;
    }

    let types = pokemonMap[party[0].id].type;
    for (let i = 1; i < party.length; i++) {
        const ptypes = pokemonMap[party[i].id].type;
        types = types.filter(t => ptypes.includes(t));
        if (!types.length) {
            return undefined;
        }
    }

    return types;
};

const bananaCheck = (saveData) => {
    let banana = 0;

    // If Discord ID is invalid
    if (saveData.save?.discord?.ID && saveData.save?.discord?.ID.length < 17) {
        banana++;
    }

    // Check if the player has more than 3 oak items active
    if (Object.values(saveData.save?.oakItems || {}).filter(i => i.isActive).length > 3) {
        banana++;
    }

    // If more than 10 billion of any ball type
    if (Math.max(...saveData.save?.pokeballs?.pokeballs || []) > 1e10) {
        banana++;
    }

    // More Master balls total than obtained
    const masterballsObtained = saveData.save?.statistics?.pokeballsObtained?.[GameConstants.Pokeball.Masterball] || 0;
    const masterballsTotal = (saveData.save?.pokeballs?.pokeballs?.[GameConstants.Pokeball.Masterball] || 0) + (saveData.save?.statistics.pokeballsUsed?.[GameConstants.Pokeball.Masterball] || 0);
    // give leeway for x masterballs
    if (masterballsTotal > (masterballsObtained + 500)) {
        banana++;
    }

    // More gems than gems gained
    const gemsCheck = saveData.save?.statistics?.gemsGained?.some((v, i) => (saveData.save?.gems?.gemWallet?.[i] || 0) > v);
    if (gemsCheck) {
        banana++;
    }

    if (banana > 0) {
        Util.notify({
            message: '🍌'.repeat(banana),
            type: 'primary',
            timeout: 15000
        });
    }
};

const loadPreviousFile = (index) => {
    const file = prevLoadedSaves()[index];
    if (file) {
        const decompressed = Util.decompressString(file.data);
        loadSaveData(decompressed, file.name);
    }
};

const isLoaded = ko.pureComputed(() => {
    return file() !== undefined;
});

const isOlderVersion = ko.pureComputed(() => {
    const saveVersion = file()?.save.update.version;
    return saveVersion && saveVersion != Companion.package.version;
});

const initialize = () => {
    const prevSaves = localStorage.getItem('prevLoadedSaves');
    if (prevSaves) {
        prevLoadedSaves(JSON.parse(prevSaves));
    }

    prevLoadedSaves.subscribe((value) => {
        localStorage.setItem('prevLoadedSaves', JSON.stringify(value));
    });
};

const origAchievementBonus = AchievementHandler.achievementBonus;
const loadAttackData = () => {
    if (!isLoaded() || isDamageLoaded()) {
        return;
    }

    AchievementHandler.achievementList = [];
    AchievementHandler.achievementBonus = origAchievementBonus;
    AchievementHandler.initialize(App.game.multiplier, App.game.challenges);

    // load starters
    player.regionStarters = [];
    const savedPlayer = SaveData.file().player;
    for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
        if (savedPlayer.regionStarters && savedPlayer.regionStarters[i] != undefined) {
            player.regionStarters.push(ko.observable(savedPlayer.regionStarters[i]));
        } else if (i < (savedPlayer.highestRegion ?? 0)) {
            player.regionStarters.push(ko.observable(GameConstants.Starter.Grass));
        } else if (i == (savedPlayer.highestRegion ?? 0)) {
            player.regionStarters.push(ko.observable(GameConstants.Starter.None));
        } else {
            this.regionStarters.push(ko.observable(GameConstants.Starter.None));
        }
    }

    player.effectList = Save.initializeEffects(SaveData.file().player.effectList);
    const itemList = SaveData.file().player._itemList;
    player.itemList = Save.initializeItemlist();
    if (itemList) {
        for (const key in itemList) {
            if (player.itemList[key]) {
                player.itemList[key](itemList[key]);
            }
        }
    }

    GameHelper.enumStrings(GameConstants.FluteItemType).forEach((flute) => {
        player.effectList[flute](0);
        player.itemList[flute](1);
    })

    EffectEngineRunner.initialize(App.game.multiplier, GameHelper.enumStrings(GameConstants.BattleItemType).map((name) => ItemList[name]));
    FluteEffectRunner.initialize(App.game.multiplier);

    // everything we need to load to calculate true damage
    const thingsToLoad = ['breeding', 'keyItems', 'badgeCase', 'oakItems', 'party', 'gems', 'farming', 'statistics', 'quests', 'challenges', 'multiplier'];

    Object.keys(App.game).filter(key => thingsToLoad.includes(key)).filter(key => App.game[key]?.saveKey).forEach(key => {
    //Object.keys(App.game).filter(key => App.game[key]?.saveKey).forEach(key => {
        const saveKey = App.game[key].saveKey;
        App.game[key].fromJSON(SaveData.file().save[saveKey]);
    });

    SaveData.file().save.achievements?.forEach((achievementName) => {
        const achievement = AchievementHandler.findByName(achievementName);
        if (achievement) {
            achievement.unlocked(true);
        }
    });

    AchievementHandler.preCheckAchievements();
    AchievementHandler.calculateMaxBonus();
    AchievementHandler.achievementList.forEach(a => {
        if (a.unlocked()) {
            a.isCompleted = () => true;
        } else {
            a.isCompleted = () => false;
        }
    });
    const bonus = AchievementHandler.achievementBonus();
    AchievementHandler.achievementBonus = () => bonus;

    // set all pokemon to max level to handle attack calculations better
    App.game.party.caughtPokemon.forEach(p => p.level = App.game.badgeCase.maxLevel());

    BattleCalculator.settings.xAttackEnabled(false);
    BattleCalculator.settings.activeFlutes([]);

    isDamageLoaded(true);
};

module.exports = {
    file,
    prevLoadedSaves,

    loadFile,
    loadSaveData,
    loadPreviousFile,
    loadAttackData,

    isLoaded,
    isOlderVersion,
    getMonoType,

    initialize,
    isDamageLoaded,
}
},{}],45:[function(require,module,exports){
const selectedFix = ko.observable();
const selectedFile = ko.observable();
const saveFixError = ko.observable();

const fixList = [
    /*{
        name: 'v0.10.20 Game Stuck Loading',
        description: 'After selecting a save file the game never loads',
        requireCurrentVersion: false,
        fixFunction: (playerData, saveData, settingsData) => {
            if (settingsData.vitaminRegionFilter !== undefined) {
                settingsData.vitaminRegionFilter = -2;
            }

            if (settingsData.consumableRegionFilter !== undefined) {
                settingsData.consumableRegionFilter = -2;
            }

            if (settingsData.heldItemRegionFilter !== undefined) {
                settingsData.heldItemRegionFilter = -2;
            }

            if (settingsData.breedingCategoryFilter !== undefined) {
                settingsData.breedingCategoryFilter = -1;
            }

            if (settingsData.pokedexCategoryFilter !== undefined) {
                settingsData.pokedexCategoryFilter = -1;
            }

            return true;
        }
    },*/
    /*{
        name: 'Hatchery List Stuck',
        description: 'Your hatchery list is stuck loading and only showing one or no pokemon',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            saveData.party.caughtPokemon.forEach((pokemon) => {
                if (!Array.isArray(pokemon[6])) {
                    pokemon[6] = [pokemon[6] ?? 0];
                }
            });

            return true;
        }
    },*/
    /*{
        name: 'Anomaly Mewtwo - Castelia City',
        description: 'Anomaly Mewtwo missing from Castelia City for the An Unrivaled Power quest line.',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            const tempBattleIndex = GameConstants.getTemporaryBattlesIndex('Anomaly Mewtwo 5');
            if (!saveData.statistics.temporaryBattleDefeated[tempBattleIndex]) {
                saveFixError('Battle is not marked as completed, nothing to fix.');
                return false;
            }

            const questState = saveData.quests.questLines.find(ql => ql.name === 'An Unrivaled Power')?.state ?? 0;
            if (questState === QuestLineState.ended) {
                saveFixError('Quest line has already been completed.');
                return false;
            }

            saveData.statistics.temporaryBattleDefeated[tempBattleIndex] = 0;
            return true;
        }
    },
    {
        name: 'A New World - Distortion World',
        description: 'The A New World quest line is softlocked because Distortion World is unavailable.',
        requireCurrentVersion: true,
        fixFunction: (playerData, saveData, settingsData) => {
            const dungeonIndex = GameConstants.getDungeonIndex('Distortion World');
            if (!saveData.statistics.dungeonsCleared[dungeonIndex]) {
                saveFixError('Distortion World has not been previously cleared, nothing to fix.');
                return false;
            }

            const questState = saveData.quests.questLines.find(ql => ql.name === 'A New World')?.state ?? 0;
            if (questState !== QuestLineState.started) {
                saveFixError('Quest line has already been completed or is not started.');
                return false;
            }

            saveData.statistics.dungeonsCleared[dungeonIndex] = 0;
            return true;
        }
    },*/
];

const canRunFix = ko.pureComputed(() => {
    return selectedFix() && selectedFile();
});

const fixSave = async () => {
    saveFixError(undefined);

    if (!canRunFix()) {
        saveFixError('Select a fix to apply and a save file.');
        return;
    }

    const file = selectedFile();
    const saveData = await loadFile(file);
    const fix = selectedFix();

    if (fix.requireCurrentVersion) {
        const saveVersion = saveData.save.update.version;
        if (saveVersion != Companion.package.version) {
            saveFixError(`This fix requires a save file from the current version - ${Companion.package.version}.`);
            return;
        }
    }

    if (fix.fixFunction(saveData.player, saveData.save, saveData.settings)) {
        const data = btoa(JSON.stringify(saveData));
        const fixedFileName = file.name.replace('.txt', '_Fixed.txt');
        Util.downloadFile(data, fixedFileName);
    }
};

const loadFile = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = JSON.parse(atob(e.target.result));
            resolve(content);
        };
        reader.readAsText(file);
    });
}

module.exports = {
    selectedFix,
    selectedFile,
    saveFixError,
    fixList,

    canRunFix,
    fixSave,
};
},{}],46:[function(require,module,exports){
const showRequiredOnly = ko.observable(false);
const showAllRegions = ko.observable(false);
const defaultTab = ko.observable('tab-my-save');

showRequiredOnly.subscribe((value) => localStorage.setItem('showRequiredOnly', +value));
showAllRegions.subscribe((value) => localStorage.setItem('showAllRegions', +value));
defaultTab.subscribe((value) => localStorage.setItem('defaultTab', value));

const initialize = () => {
    if (+localStorage.getItem('showRequiredOnly')) {
        showRequiredOnly(true);
    }
    
    if (+localStorage.getItem('showAllRegions')) {
        showAllRegions(true);
    }
    
    if (localStorage.getItem('defaultTab') && !window.location.hash.includes('#!')) {
        const tab = localStorage.getItem('defaultTab');
        if (document.getElementById(tab)) {
            defaultTab(tab);
            (new bootstrap.Tab(document.getElementById(tab))).show();
        }
    }
};

module.exports = {
    showRequiredOnly,
    showAllRegions,
    defaultTab,

    initialize,
};
},{}],47:[function(require,module,exports){
const formatDate = (date) => {
    if (!date) return undefined;
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

const formatDateTime = (date) => {
    if (!date) return undefined;
    return `${formatDate(date)} ${formatTime24Hours(date)}`;
};

const formatTime24Hours = (date) => {
    if (!date) return undefined;
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const dateAddHours = (startDate, hours) => {
    const date = new Date(startDate);
    date.setHours(date.getHours() + hours);
    return date;
};

const arrayToWhatever = (array) => {
    const newArray = [];
    for (let i = 0; i < array.length; i += 2) {
        newArray.push([array[i], array?.[i+1] ]);
    }
    return newArray;
};

const splitArrayAlternating = (array, n = 2) => {
    const newArray = Array.from({ length: n }, _ => []);
    for (let i = 0; i < array.length; i++) {
        newArray[i % n].push(array[i]);
    }

    return newArray;
};

const splitArrayChunked = (array, n = 2) => {
    const remainder = array.length % n;
    const size = Math.floor(array.length / n);
    let j = 0;
    return Array.from({ length: n }, (_, i) => array.slice(j, j += size + (i < remainder)));
};

const exportToCsv = (headers, data, fileName = 'export.csv') => {
    const rows = [
        headers.join(','),
        ...data.map(d => d.join(','))
    ];

    downloadFile(rows.join('\n'), fileName, 'text/csv');
};

const downloadFile = (data, fileName, type = 'text/plain') => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${fileName}`);
    a.click();
};

const lzutf8 = require('lzutf8');

const compressString = (input, outputEncoding = 'Base64') => {
    return lzutf8.compress(input, { outputEncoding });
};

const decompressString = (input, inputEncoding = 'Base64') => {
    return lzutf8.decompress(input, { inputEncoding });
};

const notify = ({
    message,
    type = 'primary',
    timeout = 5000,
    title = '',
    onHideFunction = undefined,
}) => {
    const toastId = Rand.string(7);
    const toastHtml =
    `<div id="${toastId}" class="toast bg-${type}" data-bs-autohide="false">
        ${title ? `<div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>` : ''}
        <div class="toast-body d-flex">
            <span class="flex-grow-1">${message.replace(/\n/g, '<br/>')}</span>
            ${title ? '' : '<button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>'}
        </div>
    </div>`;

    $('#toaster').prepend(toastHtml);
    $(`#${toastId}`)?.toast('show');

    $(`#${toastId}`).on('shown.bs.toast', () => {
        setTimeout(() => {
            $(`#${toastId}`).toast('hide');
        }, timeout);
    });

    $(`#${toastId}`).on('hidden.bs.toast', () => {
        document.getElementById(toastId).remove();
        onHideFunction?.();
    });
};

const getRegionNameText = (region, subRegion = 0) => {
    const regionName = GameConstants.camelCaseToString(GameConstants.Region[region]);
    const subRegionName = SubRegions.getSubRegionById(region, subRegion)?.name;
    if (regionName == subRegionName || !subRegionName) {
        return regionName;
    }
    return `${regionName} / ${subRegionName}`;
};

const notifications = [
    {
        id: 'newfeatbattlecalculator',
        title: 'New Feature',
        message: 'Check out the new Battle Calculator on the Tools tab to see if your party is ready to take on their next challenge!',
        type: 'info',
        timeout: 30000,
        expires: new Date(2024, 2, 22),
    },
    {
        id: 'newforecastsummary',
        title: 'Daily Summary',
        message: `Check out the <a class="text-dark text-decoration-underline" href="/#!Forecast/Summary" onclick="$('#tab-forecasts').click(); $('#tab-summary').click(); return false;">Daily Summary</a> on the Forecasts tab for a quick look at daily occurrences all in one place!`,
        type: 'info',
        timeout: 30000,
        expires: new Date(2024, 9, 16),
    },
];

const createNotifications = () => {
    const seenNotifications = JSON.parse(localStorage.getItem('seenNotifications')) || [];
    notifications.filter(n => Date.now() < n.expires && !seenNotifications.includes(n.id)).forEach(n => {
        Util.notify({
            message: n.message,
            type: n.type,
            timeout: n.timeout,
            title: n.title,
            onHideFunction: () => {
                const seen = JSON.parse(localStorage.getItem('seenNotifications')) || [];
                seen.push(n.id);
                localStorage.setItem('seenNotifications', JSON.stringify(seen));
            }
        });
    });
};

module.exports = {
    formatDate,
    formatDateTime,
    formatTime24Hours,
    dateAddHours,

    arrayToWhatever,
    splitArrayAlternating,
    splitArrayChunked,

    exportToCsv,
    downloadFile,

    compressString,
    decompressString,

    notify,
    getRegionNameText,
    createNotifications,
};
},{"lzutf8":6}],48:[function(require,module,exports){
const getBreedingAttackBonus = (vitaminsUsed, baseAttack) => {
    const attackBonusPercent = (GameConstants.BREEDING_ATTACK_BONUS + vitaminsUsed[GameConstants.VitaminType.Calcium]) / 100;
    const proteinBoost = vitaminsUsed[GameConstants.VitaminType.Protein];
    return (baseAttack * attackBonusPercent) + proteinBoost;
}

const calcEggSteps = (vitaminsUsed, eggCycles) => {
    const div = 300;
    const extraCycles = (vitaminsUsed[GameConstants.VitaminType.Calcium] + vitaminsUsed[GameConstants.VitaminType.Protein]) / 2;
    const steps = (eggCycles + extraCycles) * GameConstants.EGG_CYCLE_MULTIPLIER;
    return steps <= div ? steps : Math.round(((steps / div) ** (1 - vitaminsUsed[GameConstants.VitaminType.Carbos] / 70)) * div);
}

const getEfficiency = (vitaminsUsed, baseAttack, eggCycles) => {
    return (getBreedingAttackBonus(vitaminsUsed, baseAttack) / calcEggSteps(vitaminsUsed, eggCycles)) * GameConstants.EGG_CYCLE_MULTIPLIER;
}

const getBestVitamins = (pokemon, region) => {
    const baseAttack = pokemon.attack;
    const eggCycles = pokemon.eggCycles;
    // Add our initial starting eff here
    let res = {
        protein: 0,
        calcium: 0,
        carbos: 0,
        eff: getEfficiency([0,0,0], baseAttack, eggCycles),
    };
    vitaminsUsed = {};
    totalVitamins = (region + 1) * 5;
    // Unlocked at Unova
    carbos = (region >= GameConstants.Region.unova ? totalVitamins : 0) + 1;
    while (carbos-- > 0) {
        // Unlocked at Hoenn
        calcium = (region >= GameConstants.Region.hoenn ? totalVitamins - carbos: 0) + 1;
        while (calcium-- > 0) {
            protein = (totalVitamins - (carbos + calcium)) + 1;
            while (protein-- > 0) {
                const eff = getEfficiency([protein, calcium, carbos], baseAttack, eggCycles);
                // If the previous result is better than this, no point to continue
                if (eff < res.eff) break;
                // Push our data if same or better
                res = {
                    protein,
                    calcium,
                    carbos,
                    eff,
                };
            }
        }
    }
    return res;
}

const loadVitaminTrackerTable = ko.observable(false);
const highestRegion = ko.observable(GameConstants.Region.kanto);
const searchValue = ko.observable('');
const hidePokemonOptimalVitamins = ko.observable(false);
const hideUncaughtPokemon = ko.observable(false);
const hideShinyPokemon = ko.observable(false);

hidePokemonOptimalVitamins.subscribe((value) => localStorage.setItem('hidePokemonOptimalVitamins', +value));
hideUncaughtPokemon.subscribe((value) => localStorage.setItem('hideUncaughtPokemon', +value));
hideShinyPokemon.subscribe((value) => localStorage.setItem('hideShinyPokemon', +value));

const tableSort = ko.observable('id');
const tableSortDir = ko.observable(false);

const pokemonVitaminList = (() => {
    const pokemon = [...Companion.data.obtainablePokemonList];
    pokemon.forEach((p) => {
        p.baseAttackBonus = getBreedingAttackBonus([0,0,0], p.attack);
        p.baseEggSteps = calcEggSteps([0,0,0], p.eggCycles);
        p.regionVitamins = [];
        for (let i = 0; i <= GameConstants.MAX_AVAILABLE_REGION; i++) {
            const res = getBestVitamins(p, i);
            const vitamins = [res.protein, res.calcium, res.carbos];
            p.regionVitamins[i] = {
                bestVitamins: vitamins,
                breedingEfficiency: res.eff,
                vitaminEggSteps: calcEggSteps(vitamins, p.eggCycles),
                attackBonus: getBreedingAttackBonus(vitamins, p.attack),
            };
        }
    });

    return pokemon;
})();

const getVitaminPokemonList = ko.pureComputed(() => {
    if (!loadVitaminTrackerTable()) { // wait until document ready to load
        return [];
    }

    const region = highestRegion();
    const saveLoaded = SaveData.isLoaded();
    const pokemon = getFilteredVitaminList();
    pokemon.forEach((p) => {
        const regionVitamins = p.regionVitamins[region];
        p.bestVitamins = regionVitamins.bestVitamins;
        p.breedingEfficiency = regionVitamins.breedingEfficiency;
        p.vitaminEggSteps = regionVitamins.vitaminEggSteps;
        p.attackBonus = regionVitamins.attackBonus;
        p.vitaminText = p.bestVitamins.map((v, i) => {
            return saveLoaded ? `${Companion.partyList()[p.id]?.vitaminsUsed[i]() ?? 0} | ${v}` : `${v}`;
        });
    });

    return pokemon;
});

const getFilteredVitaminList = () => {
    const region = highestRegion();
    const searchVal = searchValue()?.toLowerCase();

    return pokemonVitaminList.filter((pokemon) => {
        if (pokemon.obtainRegion > region) {
            return false;
        }

        if (searchVal) {
            if (!pokemon.id.toString().includes(searchVal)
                && !pokemon.name.toLowerCase().includes(searchVal)) {
                return false;
            }
        }

        const partyPokemon = Companion.partyList()[pokemon.id];
        if (SaveData.isLoaded() && hideUncaughtPokemon() && !partyPokemon) {
            return false;
        }

        if (partyPokemon?.shiny && hideShinyPokemon()) {
            return false;
        }

        if (hidePokemonOptimalVitamins()) {
            if (partyPokemon && GameHelper.enumNumbers(GameConstants.VitaminType).every((v) => pokemon.bestVitamins[v] == partyPokemon.vitaminsUsed[v]())) {
                return false;
            }
        }

        return true;
    });
};

const getSortedVitaminList = ko.pureComputed(() => {
    const sortOption = tableSort();
    const sortDirection = tableSortDir();
    return Object.values(getVitaminPokemonList()).sort(compareBy(sortOption, sortDirection));
});

const getTotalVitaminsNeeded = ko.pureComputed(() => {
    const vitaminCount = [0, 0, 0];

    getVitaminPokemonList().forEach((p) => {
        p.bestVitamins.forEach((count, i) => vitaminCount[i] += count);
    });

    const totalPrice = vitaminCount.reduce((sum, count, i) => {
        return sum += ItemList[GameConstants.VitaminType[i]].totalPrice(count);
    }, 0);

    return { vitaminCount: vitaminCount, totalCost: totalPrice };
});

const exportData = () => {
    const isSaveLoaded = SaveData.isLoaded();
    const headers = [ '#', 'Pokemon', 'Type 1', 'Type 2' ];
    if (isSaveLoaded) {
        headers.push('Caught', 'Shiny');
    }
    headers.push('Native Region', 'Base Attack', 'Base Attack Bonus', 'Base Egg Steps');
    GameHelper.enumStrings(GameConstants.VitaminType).forEach((v) => {
        if (isSaveLoaded) {
            headers.push(`Current ${v}`);
        }
        headers.push(`Optimal ${v}`);
    });
    headers.push('Vitamin Attack Bonus', 'Vitamin Egg Steps', 'Breeding Efficiency');

    const data = [];
    getSortedVitaminList().forEach((p) => {
        const types = pokemonMap[p.id].type;
        const row = [ p.id, `"${p.name}"`, PokemonType[types[0]], PokemonType[types[1] ?? -1] ];

        if (isSaveLoaded) {
            row.push(
                Companion.partyList()[p.id] ? 1 : 0,
                Companion.partyList()[p.id]?.shiny ? 1 : 0
            );
        }

        row.push(
            GameConstants.camelCaseToString(GameConstants.Region[p.nativeRegion]),
            p.attack,
            p.baseAttackBonus,
            p.baseEggSteps
        );

        p.bestVitamins.forEach((v, i) => {
            if (isSaveLoaded) {
                row.push(Companion.partyList()[p.id]?.vitaminsUsed[i]() ?? 0);
            }
            row.push(v);
        });

        row.push(
            p.attackBonus,
            p.vitaminEggSteps,
            p.breedingEfficiency
        );

        data.push(row);
    });

    Util.exportToCsv(headers, data, `VitaminTracker-${Date.now()}.csv`);
};

function compareBy(sortOption, direction) {
    return function (a, b) {
        let res, dir = direction ? -1 : 1;

        const aValue = getSortValue(sortOption, a);
        const bValue = getSortValue(sortOption, b);
        
        if (aValue == bValue) {
            return a.id - b.id;
        } else if (aValue < bValue) {
            res = -1;
        } else if (aValue > bValue) {
            res = 1;
        } else {
            res = 0;
        }

        return res * dir;
    }
}

function getSortValue(sortOption, pokemon) {
    switch (sortOption) {
        case 'name':
            return pokemon.name;
        case 'base-attack':
            return pokemon.attack;
        case 'base-bonus':
            return pokemon.baseAttackBonus;
        case 'base-steps':
            return pokemon.baseEggSteps;
        case 'vitamin-bonus':
            return pokemon.attackBonus;
        case 'vitamin-steps':
            return pokemon.vitaminEggSteps;
        case 'breeding-efficiency':
            return pokemon.breedingEfficiency;
        case 'id':
        default:
            return pokemon.id;
    }
}

$(document).ready(() => {
    if (+localStorage.getItem('hidePokemonOptimalVitamins')) {
        hidePokemonOptimalVitamins(true);
    }

    if (+localStorage.getItem('hideUncaughtPokemon')) {
        hideUncaughtPokemon(true);
    }

    if (+localStorage.getItem('hideShinyPokemon')) {
        hideShinyPokemon(true);
    }

    $(document).on('click', '#vitaminTrackerTable thead th.sortable', (e) => {
        const sort = e.currentTarget.dataset.sort;
        if (tableSort() == sort) {
            tableSortDir(!tableSortDir());
        } else {
            tableSort(sort);
            tableSortDir(true);
        }
    });

    loadVitaminTrackerTable(true);
});

module.exports = {
    highestRegion,
    searchValue,
    hidePokemonOptimalVitamins,
    hideUncaughtPokemon,
    hideShinyPokemon,

    getSortedVitaminList,
    getTotalVitaminsNeeded,

    exportData,
};
},{}]},{},[43]);
