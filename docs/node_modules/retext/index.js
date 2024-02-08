import {unified} from 'unified'
import retextLatin from 'retext-latin'
import retextStringify from 'retext-stringify'

export const retext = unified().use(retextLatin).use(retextStringify).freeze()
