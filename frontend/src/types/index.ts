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
  group?: string;
  content?: unknown;
  isPublic?: boolean;
}

export interface UpdateBinInput {
  name?: string;
  group?: string;
  content?: unknown;
  isPublic?: boolean;
}
