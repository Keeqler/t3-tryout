import { router } from '../trpc'
import { authRouter } from './auth'
import { postRouter } from './post'
import { voteRouter } from './vote'

export const appRouter = router({
  post: postRouter,
  auth: authRouter,
  vote: voteRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
