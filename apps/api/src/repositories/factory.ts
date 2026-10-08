import type { Env } from '../env.js';
import type {
  FavoriteRepository,
  OrderRepository,
  ProductRepository,
  ProductReviewRepository,
  UserRepository,
  NewsletterRepository,
  WantListRepository,
} from './interfaces.js';
import { FavoriteRepository as MemoryFavoriteRepository } from './favorites.js';
import { OrderRepository as MemoryOrderRepository } from './orders.js';
import { ProductRepository as MemoryProductRepository } from './products.js';
import { ProductReviewRepository as MemoryProductReviewRepository } from './reviews.js';
import { UserRepository as MemoryUserRepository } from './users.js';
import { MemoryNewsletterRepository } from './newsletter.js';
import { WantListRepository as MemoryWantListRepository } from './want-list.js';
import { PrismaFavoriteRepository } from './prisma/favorites.js';
import { PrismaOrderRepository } from './prisma/orders.js';
import { PrismaProductRepository } from './prisma/products.js';
import { PrismaProductReviewRepository } from './prisma/reviews.js';
import { PrismaUserRepository } from './prisma/users.js';
import { PrismaNewsletterRepository } from './prisma/newsletter.js';
import { PrismaWantListRepository } from './prisma/want-list.js';

export interface DataRepositories {
  users: UserRepository;
  orders: OrderRepository;
  products: ProductRepository;
  favorites: FavoriteRepository;
  reviews: ProductReviewRepository;
  wantList: WantListRepository;
  newsletter: NewsletterRepository;
}

export function createMemoryRepositories(): DataRepositories {
  const products = new MemoryProductRepository();
  const users = new MemoryUserRepository();
  return {
    users,
    orders: new MemoryOrderRepository(),
    products,
    favorites: new MemoryFavoriteRepository(products),
    reviews: new MemoryProductReviewRepository(users),
    wantList: new MemoryWantListRepository(users),
    newsletter: new MemoryNewsletterRepository(),
  };
}

export function createRepositories(env: Env): DataRepositories {
  if (env.databaseEnabled) {
    return {
      users: new PrismaUserRepository(),
      orders: new PrismaOrderRepository(),
      products: new PrismaProductRepository(),
      favorites: new PrismaFavoriteRepository(),
      reviews: new PrismaProductReviewRepository(),
      wantList: new PrismaWantListRepository(),
      newsletter: new PrismaNewsletterRepository(),
    };
  }
  return createMemoryRepositories();
}
