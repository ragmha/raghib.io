import { getCollection } from 'astro:content'
import { projectSnapshot } from '../content/project-snapshot'
import { indexProjectWriteups } from './project-writeup-index'

export async function getPublishedProjectWriteups() {
  return indexProjectWriteups(await getCollection('projectWriteups'), projectSnapshot)
}
