import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function load()  {
  const posts = await prisma.post.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc'
    },
  })
  return {
    posts
  }
}