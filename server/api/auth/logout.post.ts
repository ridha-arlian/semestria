import { clearUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await clearUser(event)
  return { ok: true }
})
