import { z } from 'zod'

import { router, publicProcedure, protectedProcedure } from '../trpc'
import { prisma } from '../../db/client'
import type { Post } from '@prisma/client'

export const postRouter = router({
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.post.create({ data: { authorId: ctx.session.user.id, content: input.content } })
    }),

  infinitePosts: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50
      const { cursor } = input

      const posts = await prisma.post.findMany({
        include: {
          author: {
            select: { name: true, image: true },
          },
          votes: {
            where: { voterId: ctx.session?.user?.id },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'desc' },
      })

      let nextCursor: typeof cursor | undefined = undefined

      if (posts.length > limit) {
        const nextItem = posts.pop() as Post
        nextCursor = nextItem.id
      }

      return {
        posts,
        nextCursor,
      }
    }),
})
