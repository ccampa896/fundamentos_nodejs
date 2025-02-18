import { database } from './database.js';
import { randomUUID } from 'node:crypto';
import { buildRoutePath } from './utils/build-route-path.js';
import { processCSV } from './utils/processCSV.js';
import busboy from 'busboy';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const routes = [
  {
    method: 'GET',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      const { search } = req.query;
      const tasks = database.select(
        'tasks',
        search
          ? {
              title: search,
              description: search,
            }
          : null
      );
      return res.end(JSON.stringify(tasks));
    },
  },
  {
    method: 'POST',
    path: buildRoutePath('/upload'),
    handler: (req, res) => {
      const uploadDir = 'uploads';
      if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir);
      }

      let responseSent = false;
      let csvFilePath = '';

      const bb = busboy({
        headers: req.headers,
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      });

      bb.on('file', (fieldName, file, info) => {
        csvFilePath = join(
          uploadDir,
          `busboy-upload-${info.filename || fieldName}`
        );
        console.log(`Salvando arquivo temporário: ${csvFilePath}`);
        const fileStream = createWriteStream(csvFilePath);

        file.pipe(fileStream);

        fileStream.on('finish', () => {
          console.log(`Arquivo salvo em: ${csvFilePath}`);
          // Após salvar o arquivo, inicia o processamento do CSV.
          processCSV(csvFilePath, res);
        });

        fileStream.on('error', err => {
          console.error('Erro ao salvar o arquivo:', err);
          if (!responseSent) {
            responseSent = true;
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao salvar o arquivo' }));
          }
        });
      });

      bb.on('error', err => {
        console.error('Erro no processamento do upload:', err);
        if (!responseSent) {
          responseSent = true;
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro no processamento do upload' }));
        }
      });

      bb.on('close', () => {
        // Se nenhum arquivo for enviado, envia um erro.
        if (!csvFilePath && !responseSent) {
          responseSent = true;
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Nenhum arquivo enviado' }));
        }
      });

      req.pipe(bb);
    },
  },
  {
    method: 'POST',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      const { title, description } = req.body;

      if (!title || !description) {
        return res.writeHead(400).end();
      }

      const task = {
        id: randomUUID(),
        title: title,
        description: description,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      database.insert('tasks', task);

      return res.writeHead(201).end();
    },
  },
  {
    method: 'PUT',
    path: buildRoutePath('/tasks/:id'),
    handler: async (req, res) => {
      const { id } = req.params;
      const { title, description } = req.body;

      if (!title || !description) {
        return res.writeHead(400).end();
      }

      const data = {
        title: title,
        description: description,
        updated_at: new Date().toISOString(),
      };

      const updatedTask = await database.update('tasks', id, data);

      if (!updatedTask) {
        return res
          .writeHead(404, { 'Content-Type': 'application/json' })
          .end(
            JSON.stringify({ message: `Task com ID ${id} não localizada!` })
          );
      }

      return res.writeHead(204).end();
    },
  },
  {
    method: 'DELETE',
    path: buildRoutePath('/tasks/:id'),
    handler: async (req, res) => {
      const { id } = req.params;
      const deletedTask = await database.delete('tasks', id);

      if (!deletedTask) {
        return res
          .writeHead(404, { 'Content-Type': 'application/json' })
          .end(
            JSON.stringify({ message: `Task com ID ${id} não localizada!` })
          );
      }

      return res.writeHead(204).end();
    },
  },
  {
    method: 'PATCH',
    path: buildRoutePath('/tasks/:id/complete'),
    handler: async (req, res) => {
      const { id } = req.params;
      const partialUpdatedTask = await database.update('tasks', id, {
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!partialUpdatedTask) {
        return res
          .writeHead(404, { 'Content-Type': 'application/json' })
          .end(
            JSON.stringify({ message: `Task com ID ${id} não localizada!` })
          );
      }

      return res.writeHead(204).end();
    },
  },
  {
    method: 'PATCH',
    path: buildRoutePath('/tasks/:id/partial'),
    handler: async (req, res) => {
      const { id } = req.params;
      let data = req.body;

      const updated_time = new Date().toISOString();

      data = {
        ...data,
        updated_at: updated_time,
      };

      const partialUpdatedTask = await database.update('tasks', id, data);

      if (!partialUpdatedTask) {
        return res
          .writeHead(404, { 'Content-Type': 'application/json' })
          .end(
            JSON.stringify({ message: `Task com ID ${id} não localizada!` })
          );
      }

      return res.writeHead(204).end();
    },
  },
];
