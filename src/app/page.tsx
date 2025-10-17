import { prisma } from "@/lib/db";

const Page = async () => {
  const users = await prisma.post.findMany();
    
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Posts</h1>
      <ul className="space-y-4">
        {users.map((post) => (
          <li key={post.id} className="p-4 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 text-gray-600">{post.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;