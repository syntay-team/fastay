import Busboy from 'busboy';

type FieldMap = Record<string, string | string[]>;
type FileInfo = {
  filename: string;
  encoding: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};
type FileMap = Record<string, File[]>;

// Classe File compatível com a do browser
export class File {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;

  constructor(file: FileInfo) {
    this.name = file.filename;
    this.type = file.mimeType;
    this.size = file.size;
    this.buffer = file.buffer;
  }

  arrayBuffer() {
    return this.buffer.buffer.slice(
      this.buffer.byteOffset,
      this.buffer.byteOffset + this.buffer.byteLength
    );
  }
}

export function formDataMiddleware() {
  return function (req: any, res: any, next: any) {
    if (typeof req.formData === 'function') return next();

    req.formData = () =>
      new Promise((resolve, reject) => {
        const bb = Busboy({ headers: req.headers });

        const fields: FieldMap = {};
        const files: FileMap = {};

        bb.on('field', (name, value) => {
          if (name.endsWith('[]')) {
            const key = name.slice(0, -2);
            if (!fields[key]) fields[key] = [];
            (fields[key] as string[]).push(value);
          } else {
            fields[name] = value;
          }
        });

        bb.on('file', (name, file, info) => {
          const chunks: Buffer[] = [];

          file.on('data', (chunk) => chunks.push(chunk));

          file.on('end', () => {
            const buffer = Buffer.concat(chunks);

            const fileObj = new File({
              filename: info.filename,
              encoding: info.encoding,
              mimeType: info.mimeType,
              size: buffer.length,
              buffer,
            });

            if (!files[name]) files[name] = [];
            files[name].push(fileObj);
          });
        });

        bb.on('finish', () => {
          resolve(createFormDataLike(fields, files));
        });

        bb.on('error', reject);

        req.pipe(bb);
      });

    next();
  };
}

function createFormDataLike(fields: FieldMap, files: FileMap) {
  return {
    get(key: string) {
      if (files[key]) return files[key][0];
      return fields[key] ?? null;
    },

    getAll(key: string) {
      if (files[key]) return files[key];
      const val = fields[key];
      return Array.isArray(val) ? val : val ? [val] : [];
    },

    has(key: string) {
      return !!fields[key] || !!files[key];
    },

    append(key: string, value: any) {
      if (value instanceof File) {
        if (!files[key]) files[key] = [];
        files[key].push(value);
        return;
      }

      if (!fields[key]) {
        fields[key] = value;
      } else if (Array.isArray(fields[key])) {
        (fields[key] as string[]).push(value);
      } else {
        fields[key] = [fields[key] as string, value];
      }
    },

    set(key: string, value: any) {
      if (value instanceof File) {
        files[key] = [value];
        delete fields[key];
        return;
      }

      fields[key] = value;
      delete files[key];
    },

    delete(key: string) {
      delete fields[key];
      delete files[key];
    },

    *entries() {
      for (const [k, v] of Object.entries(fields)) {
        if (Array.isArray(v)) {
          for (const item of v) yield [k, item];
        } else {
          yield [k, v];
        }
      }

      for (const [k, arr] of Object.entries(files)) {
        for (const file of arr) yield [k, file];
      }
    },

    raw: { fields, files },
  };
}
