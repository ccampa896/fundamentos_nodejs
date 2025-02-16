import fs from 'node:fs/promises';

const databasePath = new URL('../db.json', import.meta.url);

export class Database {
  #database = {};

  constructor() {
    // Carrega os dados na inicialização
    this.loadData();
  }

  async loadData() {
    try {
      const data = await fs.readFile(databasePath, 'utf8');
      this.#database = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Se o arquivo não existir, inicializa com objeto vazio e o cria
        this.#database = {};
        await this.#persist();
        console.log('Arquivo db.json criado com sucesso.');
      } else {
        console.error('Erro ao ler o arquivo de banco de dados:', error);
      }
    }
  }

  async #persist() {
    try {
      await fs.writeFile(databasePath, JSON.stringify(this.#database));
    } catch (error) {
      console.error('Erro ao persistir dados:', error);
    }
  }

  // Método para recarregar os dados do arquivo JSON
  async reload() {
    try {
      const data = await fs.readFile(databasePath, 'utf8');
      this.#database = JSON.parse(data);
      console.log('Banco de dados recarregado com sucesso.');
    } catch (error) {
      console.error('Erro ao recarregar banco de dados:', error);
    }
  }

  select(table, search) {
    let data = this.#database[table] ?? [];

    if (search) {
      data = data.filter(row => {
        return Object.entries(search).some(([key, value]) => {
          const field = row[key];
          if (!field) return false;
          return field.toString().toLowerCase().includes(value.toLowerCase());
        });
      });
    }

    return data;
  }

  insert(table, data) {
    if (Array.isArray(this.#database[table])) {
      this.#database[table].push(data);
    } else {
      this.#database[table] = [data];
    }
    this.#persist();
    return data;
  }

  update(table, id, data) {
    const rowIndex = this.#database[table]?.findIndex(row => row.id === id);

    if (rowIndex > -1) {
      this.#database[table][rowIndex] = {
        ...this.#database[table][rowIndex],
        ...data,
      };
      this.#persist();
      return this.#database[table][rowIndex];
    } else {
      return false;
    }
  }

  delete(table, id) {
    const rowIndex = this.#database[table].findIndex(row => row.id === id);
    if (rowIndex > -1) {
      this.#database[table].splice(rowIndex, 1);
      this.#persist();
    } else {
      return false;
    }
  }
}

export const database = new Database();
