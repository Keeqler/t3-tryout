import * as yup from 'yup'

import { protectedProcedure, router } from '../trpc'
import { prisma } from '../../db/client'

export const voteRouter = router({
  votePost: protectedProcedure
    .input(
      yup.object({
        postId: yup.number().required(),
        increment: yup.number().required().oneOf([1, 0, -1]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let vote = await prisma.vote.findFirst({
        where: { postId: input.postId, voterId: ctx.session.user.id },
        include: { post: true },
      })

      if (vote) {
        await prisma.vote.update({
          where: { id: vote.id },
          data: { increment: input.increment },
        })
      } else {
        vote = await prisma.vote.create({
          data: { increment: input.increment, postId: input.postId, voterId: ctx.session.user.id },
          include: { post: true },
        })
      }

      const previousIncrement = vote.increment
      const currentIncrement = input.increment
      let voteCount = vote.post.voteCount

      if (previousIncrement > currentIncrement) voteCount -= previousIncrement - currentIncrement
      if (currentIncrement > previousIncrement) voteCount += currentIncrement - previousIncrement

      await prisma.post.update({
        where: { id: input.postId },
        data: { voteCount },
      })
    }),
})
