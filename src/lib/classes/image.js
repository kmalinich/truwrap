/* ───────────────────╮
 │ truwrap cli images │
 ╰────────────────────┴──────────────────────────────────────────────────────── */

import {readFileSync, statSync} from 'fs'
import {basename, extname} from 'path'
import {gte} from 'semver'
import {console} from '../../index'

const prefix = '\x1b]1337;File=inline=1;'
const suffix = '\x07'

const broken = `${__dirname}/../media/broken.png`

/**
 * Provides an image formatted for inclusion in the TTY
 * @private
 */
class Image {
	/**
	 * Create a new image reference
	 * @param  {string} $0.file   - The filename of the image.
	 * @param  {string} $0.name   - The name of the image
	 *                              [will be taken from image if missing]
	 * @param  {String} $0.width  - Can be X(chars), Xpx(pixels),
	 *                              X%(% width of window) or 'auto'
	 * @param  {String} $0.height - Can be Y(chars), Ypx(pixels),
	 *                              Y%(% width of window) or 'auto'
	 * @return {Image}  An image reference ready to be rendered.
	 */
	constructor({
			file,
			name,
			width = 'auto',
			height = 'auto'
		}) {
		const extName = extname(file)
		const fileName = name || basename(file, extName)

		const lineNameBase64 = (gte(process.version, '6.0.0') ?
			Buffer.from(fileName) :
			new Buffer(fileName)
		).toString('base64')

		this.config = `width=${width};height=${height};name=${lineNameBase64}`

		this.filePath = (function () {
			try {
				if (statSync(file).isFile()) {
					return file
				}
			} catch (err) {
				switch (err.code) {
					case 'ENOENT':
						console.warn('Warning:', `${file} not found.`)
						break
					default:
						console.error(err)
				}
				return broken
			}
		})()
	}

	/**
	 * Load and render the image into the CLI
	 * @param  {Object} options    - The options to set
	 * @property {number} align    - The line count needed to realign the cursor.
	 * @property {Boolean} stretch - Do we stretch the image to match the width
	 *                               and height.
	 * @property {Boolean} nobreak - Do we clear the image with a newline?
	 * @return {string} The string to insert into the output buffer, with base64
	 *                  encoded image.
	 */
	render(options) {
		const {align, stretch = false, nobreak} = options

		const content = (gte(process.version, '6.0.0') ?
			Buffer.from(readFileSync(this.filePath)) :
			new Buffer(readFileSync(this.filePath))
		)

		const aspect = stretch ? 'preserveAspectRatio=0;' : ''
		const linebreak = nobreak ? '' : '\n'
		const newline = align > 1 ? `\x1bH\x1b[${align}A` : linebreak

		return `${prefix}${aspect}size=${content.length}${this.config}:${
			content.toString('base64')
		}${suffix}${newline}`
	}
}

/**
 * Create a new Image
 * @private
 * @param  {Object} source - Image options
 * @return {Image} A configured (but not yet loaded) image.
 */
export default source => new Image(source)
