export default function PageSettings() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Pengaturan
        </h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Profil
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="Masukkan nama"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white"
                  placeholder="Masukkan email"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="rounded-lg bg-white p-6 shadow-md dark:bg-zinc-900">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Keamanan
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Lama
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password Baru
                </label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
              Simpan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


