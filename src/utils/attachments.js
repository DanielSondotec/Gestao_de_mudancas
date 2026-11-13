import { newId } from "./changes";

const DATABASE_NAME = "sgi-gestao-mudancas:attachments:v1";
const STORE_NAME = "attachments";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error("Este navegador não oferece armazenamento local de arquivos."));
      return;
    }

    const request = globalThis.indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Não foi possível abrir o armazenamento de arquivos."));
    request.onblocked = () =>
      reject(new Error("Feche outras abas do sistema para preparar o armazenamento de arquivos."));
  });
}

export async function saveAttachments(files) {
  if (!files.length) return [];

  const database = await openDatabase();
  const records = Array.from(files, (file) => ({
    id: newId(),
    name: file.name,
    type: file.type,
    size: file.size,
    blob: file,
  }));

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      records.forEach((record) => store.add(record));
      transaction.oncomplete = resolve;
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Não foi possível salvar os arquivos."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("O salvamento dos arquivos foi cancelado."));
    });

    return records.map(({ id, name, type, size }) => ({ id, name, type, size }));
  } finally {
    database.close();
  }
}

export async function getAttachment(id) {
  const database = await openDatabase();

  try {
    const record = await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("Não foi possível carregar o arquivo."));
    });

    if (!record?.blob) {
      throw new Error("O arquivo não está disponível neste navegador.");
    }

    return record.blob;
  } finally {
    database.close();
  }
}

export async function deleteAttachments(ids) {
  if (!ids.length) return;

  const database = await openDatabase();

  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      ids.forEach((id) => store.delete(id));
      transaction.oncomplete = resolve;
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Não foi possível apagar os arquivos anexados."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("A exclusão dos arquivos foi cancelada."));
    });
  } finally {
    database.close();
  }
}
