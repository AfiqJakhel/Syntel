export default function PageArsip() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Arsip
          </h1>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Tambah Arsip
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <input
            type="text"
            placeholder="Cari arsip..."
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-white"
          />
          <select className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-900 dark:text-white">
            <option>Semua Kategori</option>
          </select>
        </div>

        {/* Archive List */}
        <div className="rounded-lg bg-white shadow-md dark:bg-zinc-900">
          <div className="p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              Belum ada arsip
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


