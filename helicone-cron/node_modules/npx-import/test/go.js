import { npxImport, npxResolve } from '../lib/index.js'
import chalk from 'chalk'

console.log(`${chalk.green('❯')} node ./index.js --filename=image.png\n`)

try {
  const leftPad = await import('left-pad')
  console.error(`NOOO, LEFT PAD IS HERE!`)
} catch (e) {
  console.log(`This is a PNG! We'll have to compile imagemagick!`)
  await npxImport('left-pad@^1.1.0', log => console.log('  ' + chalk.gray(log.replace(/left-pad/,'imagemagick-utils'))))
}

console.log(`Done!`)
