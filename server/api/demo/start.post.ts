import { getUser } from '../../utils/auth'
import { startDemo } from '../../utils/demo'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)
  return startDemo(event, user)
})
