import { prisma } from '@/lib/prisma';
import GalleryManager from '@/components/GalleryManager';
import { getFilters } from '@/actions/artwork';
import { auth } from '@/auth';

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const artist = typeof params.artist === 'string' ? params.artist : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  const ITEMS_PER_PAGE = 50;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: any = {};
  if (category) where.category = category;
  if (artist) where.artist = artist;

  const [artworks, totalCount] = await prisma.$transaction([
    prisma.artwork.findMany({
      where,
      orderBy: {
        originalId: 'asc',
      },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.artwork.count({ where })
  ]);

  const { categories, artists } = await getFilters();

  // Fetch session for RBAC
  const session = await auth();
  // @ts-ignore
  const userRole = session?.user?.role || null;

  return (
    <GalleryManager
      artworks={artworks}
      totalCount={totalCount}
      currentPage={page}
      categories={categories}
      artists={artists}
      userRole={userRole}
    />
  );
}
