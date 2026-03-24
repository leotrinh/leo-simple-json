export interface User {
  _id: string;
  email: string;
  name: string;
  picture: string;
  provider: 'local' | 'google';
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface JsonBin {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  group: string;
  content: unknown;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBinInput {
  name: string;
  slug?: string;
  group?: string;
  content?: unknown;
  isPublic?: boolean;
}

export interface UpdateBinInput {
  name?: string;
  slug?: string;
  group?: string;
  content?: unknown;
  isPublic?: boolean;
}

export interface PublicSettings {
  allowRegistration: boolean;
  logoUrl: string;
  siteName: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}
