import { createReadStream, unlink } from 'node:fs';
import csv from 'csv-parser';
import { Database } from '../database.js';

const database = new Database();

export function processCSV(filePath, res) {
  const results = [];
  const errors = [];
  const existingTitles = new Set(
    database.select('tasks').map(task => task.title.toLowerCase())
  );

  createReadStream(filePath)
    .pipe(csv())
    .on('data', (data, index) => {
      const { title, description } = data;

      // Validação: Campos obrigatórios
      if (
        !title ||
        !description ||
        title.trim() === '' ||
        description.trim() === ''
      ) {
        errors.push({
          line: index + 1,
          error:
            'Campos title e description são obrigatórios e não podem estar vazios.',
        });
        return;
      }

      // Validação: Título duplicado
      if (existingTitles.has(title.toLowerCase())) {
        errors.push({
          line: index + 1,
          error: `A tarefa com título "${title}" já existe.`,
        });
        return;
      }

      // Tarefa válida
      const task = {
        title: title.trim(),
        description: description.trim(),
      };

      results.push(task);
      existingTitles.add(title.toLowerCase());
    })
    .on('end', () => {
      if (errors.length > 0) {
        // Se houver erros, remove o arquivo e retorna o erro
        unlink(filePath, err => {
          if (err) console.error('Erro ao deletar arquivo:', err);
          else console.log('Arquivo removido após importação com erros.');
        });
        return res
          .writeHead(400, { 'Content-Type': 'application/json' })
          .end(JSON.stringify({ message: 'Erros na importação', errors }));
      }

      // Insere todas as tarefas no banco
      results.forEach(task => database.insert('tasks', task));

      // Remove o arquivo após a importação
      unlink(filePath, err => {
        if (err) console.error('Erro ao deletar arquivo:', err);
        else console.log('Arquivo removido após importação.');
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ message: 'Importação concluída', tasks: results })
      );
    })
    .on('error', err => {
      console.error('Erro ao processar CSV:', err);
      // Em caso de erro durante a leitura do CSV, remove o arquivo
      unlink(filePath, err => {
        if (err) console.error('Erro ao deletar arquivo:', err);
        else console.log('Arquivo removido após erro no processamento do CSV.');
      });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Erro ao processar CSV' }));
    });
}
