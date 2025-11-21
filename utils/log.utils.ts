export function createActivity(module: string, name: string) {
  return `Menambahkan ${module} baru: ${name}`;
}

export function updateActivity(module: string, name: string) {
  return `Mengupdate ${module}: ${name}`;
}

export function deleteActivity(module: string, name: string) {
  return `Menghapus ${module}: ${name}`;
}
