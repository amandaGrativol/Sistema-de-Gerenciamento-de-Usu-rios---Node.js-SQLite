// Sistema de Gerenciamento de Usuários

// 1. Instale as dependências:
// npm init -y
// npm install express sqlite3 body-parser bcrypt

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.json());

// Inicializa o banco de dados
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);
});

// Rotas

// 1. Criar usuário
app.post('/users', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword],
            function (err) {
                if (err) {
                    return res.status(400).json({ error: 'Erro ao criar usuário ou e-mail já existente.' });
                }
                res.status(201).json({ id: this.lastID, name, email });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor.' });
    }
});

// 2. Listar usuários
app.get('/users', (req, res) => {
    db.all('SELECT id, name, email FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar usuários.' });
        }
        res.json(rows);
    });
});

// 3. Atualizar usuário
app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
        return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
    }

    db.run(
        'UPDATE users SET name = ?, email = ? WHERE id = ?',
        [name, email, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
            res.json({ message: 'Usuário atualizado com sucesso.' });
        }
    );
});

// 4. Deletar usuário
app.delete('/users/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Erro ao deletar usuário.' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        res.json({ message: 'Usuário deletado com sucesso.' });
    });
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
