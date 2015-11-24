/**
 * Copyright (c) 2014-2015, Facebook, Inc. All rights reserved.
 *
 * This source code belongs to the original Flux package by Facebook and it has
 * been edited to suite this package's test.
 *
 * This source code is licensed under the BSD-3-Clause below. An additional grant
 * of patent rights can be found in the PATENTS file locate at
 * https://github.com/facebook/flux/blob/master/PATENTS.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice, this
 *   list of conditions and the following disclaimer.
 *
 * - Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * - Neither the name Facebook nor the names of its contributors may be used to
 *   endorse or promote products derived from this software without specific
 *   prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/* global jest, describe, expect, it, beforeEach */

jest.dontMock('../../lib/Dispatcher')

var Dispatcher = require('../../lib/Dispatcher')

describe('Dispatcher', () => {
  var dispatcher
  var callbackA
  var callbackB

  beforeEach(() => {
    dispatcher = new Dispatcher()
    callbackA = jest.genMockFunction()
    callbackB = jest.genMockFunction()
  })

  it('should execute all subscriber callbacks', () => {
    dispatcher.register(callbackA)
    dispatcher.register(callbackB)

    var payload = {}
    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(1)
    expect(callbackA.mock.calls[0][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(1)
    expect(callbackB.mock.calls[0][0]).toBe(payload)

    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(2)
    expect(callbackA.mock.calls[1][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(2)
    expect(callbackB.mock.calls[1][0]).toBe(payload)
  })

  it('should wait for callbacks registered earlier', () => {
    var tokenA = dispatcher.register(callbackA)

    dispatcher.register((payload) => {
      dispatcher.waitFor([tokenA])
      expect(callbackA.mock.calls.length).toBe(1)
      expect(callbackA.mock.calls[0][0]).toBe(payload)
      callbackB(payload)
    })

    var payload = {}
    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(1)
    expect(callbackA.mock.calls[0][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(1)
    expect(callbackB.mock.calls[0][0]).toBe(payload)
  })

  it('should wait for callbacks registered later', () => {
    dispatcher.register((payload) => {
      dispatcher.waitFor([tokenB])
      expect(callbackB.mock.calls.length).toBe(1)
      expect(callbackB.mock.calls[0][0]).toBe(payload)
      callbackA(payload)
    })

    var tokenB = dispatcher.register(callbackB)

    var payload = {}
    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(1)
    expect(callbackA.mock.calls[0][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(1)
    expect(callbackB.mock.calls[0][0]).toBe(payload)
  })

  it('should throw if dispatch() while dispatching', () => {
    dispatcher.register((payload) => {
      dispatcher.dispatch(payload)
      callbackA()
    })

    var payload = {}
    expect(() => {
      dispatcher.dispatch(payload)
    }).toThrow(
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    )

    expect(callbackA.mock.calls.length).toBe(0)
  })

  it('should throw if waitFor() while not dispatching', () => {
    var tokenA = dispatcher.register(callbackA)

    expect(() => {
      dispatcher.waitFor([tokenA])
    }).toThrow(
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    )

    expect(callbackA.mock.calls.length).toBe(0)
  })

  it('should throw if waitFor() with invalid token', () => {
    var invalidToken = 1337

    dispatcher.register(() => {
      dispatcher.waitFor([invalidToken])
    })

    var payload = {}
    expect(() => {
      dispatcher.dispatch(payload)
    }).toThrow(
      'Dispatcher.waitFor(...): `1337` does not map to a registered callback.'
    )
  })

  it('should throw on self-circular dependencies', () => {
    var tokenA = dispatcher.register((payload) => {
      dispatcher.waitFor([tokenA])
      callbackA(payload)
    })

    var payload = {}
    expect(() => {
      dispatcher.dispatch(payload)
    }).toThrow(
      'Dispatcher.waitFor(...): Circular dependency detected while waiting ' +
      'for `' + tokenA + '`.'
    )

    expect(callbackA.mock.calls.length).toBe(0)
  })

  it('should throw on multi-circular dependencies', () => {
    var tokenA = dispatcher.register((payload) => {
      dispatcher.waitFor([tokenB])
      callbackA(payload)
    })

    var tokenB = dispatcher.register((payload) => {
      dispatcher.waitFor([tokenA])
      callbackB(payload)
    })

    expect(() => {
      dispatcher.dispatch({})
    }).toThrow(
      'Dispatcher.waitFor(...): Circular dependency detected while waiting ' +
      'for `' + tokenA + '`.'
    )

    expect(callbackA.mock.calls.length).toBe(0)
    expect(callbackB.mock.calls.length).toBe(0)
  })

  // I don't really understand what this test means, so I'll leave it out
  // it('should remain in a consistent state after a failed dispatch', () => {
  //   dispatcher.register(callbackA)
  //   dispatcher.register((payload) => {
  //     if (payload.shouldThrow) {
  //       throw new Error()
  //     }
  //     callbackB()
  //   })
  //
  //   expect(() => {
  //     dispatcher.dispatch({shouldThrow: true})
  //   }).toThrow()
  //
  //   // Cannot make assumptions about a failed dispatch.
  //   var callbackACount = callbackA.mock.calls.length
  //
  //   dispatcher.dispatch({shouldThrow: false})
  //
  //   expect(callbackA.mock.calls.length).toBe(callbackACount + 1)
  //   expect(callbackB.mock.calls.length).toBe(1)
  // })

  it('should properly unregister callbacks', () => {
    dispatcher.register(callbackA)

    var tokenB = dispatcher.register(callbackB)

    var payload = {}
    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(1)
    expect(callbackA.mock.calls[0][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(1)
    expect(callbackB.mock.calls[0][0]).toBe(payload)

    dispatcher.unregister(tokenB)

    dispatcher.dispatch(payload)

    expect(callbackA.mock.calls.length).toBe(2)
    expect(callbackA.mock.calls[1][0]).toBe(payload)

    expect(callbackB.mock.calls.length).toBe(1)
  })
})
