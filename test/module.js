'use strict'

import stream from 'stream'
import test from 'ava'
import semverRegex from 'semver-regex'
import pkg from '../package.json'
import truwrap from '..'

const StreamProxy = new stream.PassThrough()
StreamProxy.setEncoding('utf8')

const expectedVersion = pkg.build_number === 0 && pkg.version || `${pkg.version}-Δ${pkg.build_number}`

test(`Module version is '${expectedVersion}'.`, t => {
	t.is(`${expectedVersion}`, truwrap.getVersion())
})

test(`Module version '${pkg.version}' is semver.`, t => {
	t.truthy(semverRegex().test(truwrap.getVersion()))
})

test(`Returns renderer.`, t => {
	const tw = truwrap({
		left: 4,
		right: -4
	})
	t.truthy(tw.write && tw.end)
})

test.cb(`Consumes stream.`, t => {
	const tw = truwrap({
		left: 4,
		right: -4,
		mode: 'soft',
		outStream: StreamProxy
	})

	StreamProxy.on('data', buffer_ => {
		t.is(buffer_, 'Testing.')
		t.end()
	})
	tw.write('Testing.')
})
