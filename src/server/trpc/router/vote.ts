import * as yup from 'yup'

import { protectedProcedure, router } from '../trpc'
import { prisma } from '../../db/client'

const voteIncrement = { up: 1, neutral: 0, down: -1 }

type VoteType = 'up' | 'neutral' | 'down'

export const voteRouter = router({
  votePost: protectedProcedure
    .input(
      yup.object({
        postId: yup.number().required(),
        type: yup.string().required().oneOf(['up', 'down', 'neutral']),
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
          data: { type: input.type },
        })
      } else {
        vote = await prisma.vote.create({
          data: { type: input.type, postId: input.postId, voterId: ctx.session.user.id },
          include: { post: true },
        })
      }

      const previousVote = voteIncrement[vote.type as VoteType]
      const currentVote = voteIncrement[input.type as VoteType]
      let voteCount = vote.post.voteCount

      if (previousVote > currentVote) voteCount -= previousVote - currentVote
      if (currentVote > previousVote) voteCount += currentVote - previousVote

      await prisma.post.update({
        where: { id: input.postId },
        data: { voteCount },
      })
    }),
})
