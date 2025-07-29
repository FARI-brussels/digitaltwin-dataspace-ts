import { Collector } from 'digitaltwin-core'

interface Post {
  id: number
  userId: number
  title: string
  body: string
}

interface User {
  id: number
  name: string
  username: string
  email: string
  phone: string
  website: string
  address: {
    street: string
    suite: string
    city: string
    zipcode: string
    geo: {
      lat: string
      lng: string
    }
  }
  company: {
    name: string
    catchPhrase: string
    bs: string
  }
}

interface CollectedData {
  timestamp: Date
  source: 'jsonplaceholder'
  posts: Post[]
  users: User[]
  metadata: {
    postsCount: number
    usersCount: number
    collectionDuration: number
  }
}

/**
 * JSONPlaceholder Data Collector - Fetches real data from JSONPlaceholder API
 * Demonstrates collecting data from external REST APIs
 */
export class JSONPlaceholderCollector extends Collector {
  private readonly baseUrl = 'https://jsonplaceholder.typicode.com'
  
  getConfiguration() {
    return {
      name: 'jsonplaceholder-collector',
      description: 'Collects posts and users data from JSONPlaceholder API',
      contentType: 'application/json',
      endpoint: 'api/jsonplaceholder',
      tags: ['api', 'external', 'demo']
    }
  }
  
  async collect(): Promise<Buffer> {
    const startTime = Date.now()
    
    try {
      // console.log('🌐 Fetching data from JSONPlaceholder API...')
      
      // Fetch posts and users concurrently
      const [postsResponse, usersResponse] = await Promise.all([
        fetch(`${this.baseUrl}/posts?_limit=10`),
        fetch(`${this.baseUrl}/users`)
      ])
      
      if (!postsResponse.ok) {
        throw new Error(`Posts API error: ${postsResponse.status}`)
      }
      
      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`)
      }
      
      const posts: Post[] = await postsResponse.json()
      const users: User[] = await usersResponse.json()
      
      const collectionDuration = Date.now() - startTime
      
      const data: CollectedData = {
        timestamp: new Date(),
        source: 'jsonplaceholder',
        posts,
        users,
        metadata: {
          postsCount: posts.length,
          usersCount: users.length,
          collectionDuration
        }
      }
      
      // console.log(`📊 Collected ${posts.length} posts and ${users.length} users from JSONPlaceholder (${collectionDuration}ms)`)
      return Buffer.from(JSON.stringify(data, null, 2))
      
    } catch (error) {
      console.error('❌ Error collecting data from JSONPlaceholder:', error)
      
      // Return error information as data
      const errorData = {
        timestamp: new Date(),
        source: 'jsonplaceholder',
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          collectionDuration: Date.now() - startTime
        }
      }
      
      return Buffer.from(JSON.stringify(errorData, null, 2))
    }
  }
  
  getSchedule(): string {
    return '*/15 * * * * *' // Every 15 seconds
  }
}
