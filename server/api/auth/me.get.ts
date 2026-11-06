import { getUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  return (await getUser(event)) ?? null
})
