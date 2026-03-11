import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import UserTable from '@/components/UserTable';

export const metadata = {
  title: 'Admin Dashboard | Gallery Management',
};

export default async function AdminPage() {
    const session = await auth();
    
    // @ts-ignore
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/');
    }

    const { users } = await getUsers();

    return (
        <div className="min-h-screen bg-white">
            <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-40 border-b border-neutral-100 h-16 flex items-center px-4 md:px-8">
                <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
                    <h1 className="font-sans text-[10px] md:text-xs uppercase tracking-[0.3em] font-medium text-black">
                        System Administrator
                    </h1>
                    <div className="flex items-center gap-6">
                        <a href="/" className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
                            Return to Gallery
                        </a>
                    </div>
                </div>
            </header>
            
            <main className="pt-32 pb-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="mb-12">
                     <h2 className="font-serif text-3xl font-light mb-4" style={{ fontFamily: 'var(--font-playfair), serif' }}>User Management</h2>
                     <p className="font-sans text-xs text-neutral-500 max-w-2xl leading-relaxed">
                         Provision system access and assign specific database roles.
                     </p>
                </div>
                
                <UserTable initialUsers={users || []} />
            </main>
        </div>
    );
}
