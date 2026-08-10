import type { Env } from '../env.js';
import type { OrderRepository, ProductRepository, UserRepository } from './interfaces.js';
import { OrderRepository as MemoryOrderRepository } from './orders.js';
import { ProductRepository as MemoryProductRepository } from './products.js';
import { UserRepository as MemoryUserRepository } from './users.js';
import { PrismaOrderRepository } from './prisma/orders.js';
import { PrismaProductRepository } from './prisma/products.js';
import { PrismaUserRepository } from './prisma/users.js';

export interface DataRepositories {
  users: UserRepository;
  orders: OrderRepository;
  products: ProductRepository;
}

export function createMemoryRepositories(): DataRepositories {
  return {
    users: new MemoryUserRepository(),
    orders: new MemoryOrderRepository(),
    products: new MemoryProductRepository(),
  };
}

export function createRepositories(env: Env): DataRepositories {
  if (env.databaseEnabled) {
    return {
      users: new PrismaUserRepository(),
      orders: new PrismaOrderRepository(),
      products: new PrismaProductRepository(),
    };
  }
  return createMemoryRepositories();
}
