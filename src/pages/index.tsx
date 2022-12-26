import type { FormEventHandler } from 'react'
import { useEffect, useState } from 'react'
import { type NextPage } from 'next'
import { signIn, signOut, useSession } from 'next-auth/react'
import { ArrowDownFilled, ArrowUpFilled } from '@fluentui/react-icons'
import { toast } from 'react-hot-toast'
import { formatDistance } from 'date-fns'
import Image from 'next/image'
import cx from 'classnames'

import { Button } from '../components/button'
import type { RouterOutputs } from '../utils/trpc'
import { trpc } from '../utils/trpc'

const numberFormatter = Intl.NumberFormat('en', { notation: 'compact' })

const Home: NextPage = () => {
  const [contentInput, setContentInput] = useState('')
  const { data: sessionData, status } = useSession()

  const utils = trpc.useContext()

  const postCreate = trpc.post.create.useMutation({
    onSuccess: () => {
      setContentInput('')
      utils.post.infinitePosts.invalidate()
      toast.success('Post created')
    },
    onError: () => {
      toast.error('Something went wrong')
    },
  })

  const postVote = trpc.vote.votePost.useMutation({
    onMutate: async input => {
      await utils.post.infinitePosts.cancel()
      utils.post.infinitePosts.setInfiniteData({ limit: 10 }, data => {
        if (!data)
          return {
            pages: [],
            pageParams: [],
          }

        return {
          ...data,
          pages: data.pages.map(page => ({
            ...page,
            posts: page.posts.map(post => {
              if (post.id === input.postId) {
                const previousIncrement = post.votes[0]?.increment || 0
                const currentIncrement = input.increment
                let voteCount = post.voteCount

                if (previousIncrement > currentIncrement)
                  voteCount -= previousIncrement - currentIncrement
                if (currentIncrement > previousIncrement)
                  voteCount += currentIncrement - previousIncrement

                post.votes[0] = { increment: input.increment }
                post.voteCount = voteCount
              }

              return post
            }),
          })),
        }
      })
    },
    onError: () => {
      toast.error('Something went wrong')
    },
  })

  const { data, hasNextPage, isFetching, fetchNextPage } = trpc.post.infinitePosts.useInfiniteQuery(
    { limit: 10 },
    { getNextPageParam: lastPage => lastPage.nextCursor },
  )

  const handleSubmit: FormEventHandler = event => {
    event.preventDefault()
    postCreate.mutate({ content: contentInput })
  }

  function vote(post: RouterOutputs['post']['infinitePosts']['posts'][0], increment: number) {
    const previousIncrement = post.votes[0]?.increment
    postVote.mutate({ postId: post.id, increment: previousIncrement !== increment ? increment : 0 })
  }

  const posts = data?.pages.flatMap(page => page.posts) ?? []

  useEffect(() => {
    function handleScroll() {
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop

      const scrollPosition = (winScroll / height) * 100

      if (scrollPosition > 90 && hasNextPage && !isFetching) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasNextPage, isFetching, fetchNextPage])

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col gap-16">
      {status === 'unauthenticated' && (
        <div className="flex h-60 w-full rounded-lg">
          <Button onClick={() => signIn('github')} variant="solid" className="m-auto">
            Sign in with Github
          </Button>
        </div>
      )}

      {status === 'authenticated' && (
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-row justify-between">
            <div className="flex flex-row items-center gap-3">
              <Image
                alt="Your profile picture"
                src={sessionData.user?.image as string}
                width={48}
                height={48}
                className="rounded-full bg-neutral-600"
              />
              <span className="text-lg font-medium">{sessionData.user?.name}</span>
            </div>

            <Button onClick={() => signOut()} variant="ghost" className="text-red">
              Sign out
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              name="content"
              placeholder="What are your thoughts?"
              value={contentInput}
              onChange={event => setContentInput(event.target.value)}
              className="h-40 grow resize-none"
            />

            <Button type="submit" className="w-40 self-end">
              Post
            </Button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {posts.map(post => (
          <article
            key={post.id}
            className="highlight-white flex w-full flex-row items-start gap-4 rounded-lg bg-neutral-700 p-4"
          >
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={() => vote(post, 1)}
                variant="ghost"
                className={cx('h-8 w-8 px-0', post.votes[0]?.increment !== 1 && 'text-neutral-300')}
              >
                <ArrowUpFilled fontSize={18} />
              </Button>

              <span className="text-sm font-bold">{numberFormatter.format(post.voteCount)}</span>

              <Button
                onClick={() => vote(post, -1)}
                variant="ghost"
                className={cx(
                  'h-8 w-8 px-0',
                  post.votes[0]?.increment !== -1 && 'text-neutral-300',
                )}
              >
                <ArrowDownFilled fontSize={18} />
              </Button>
            </div>

            <div className="flex w-full flex-col gap-2 leading-relaxed">
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <Image
                    alt="Your profile picture"
                    src={post.author.image as string}
                    width={40}
                    height={40}
                    className="rounded-full bg-neutral-600"
                  />

                  <span className="font-medium">{post.author.name}</span>
                </div>

                <span className="text-sm text-neutral-300">
                  {formatDistance(post.createdAt, new Date())} ago
                </span>
              </div>

              <p>{post.content}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Home
