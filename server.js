const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const verificarToken = require('./middleware.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;



const db = mysql.createConnection({
    host: 'sql10.freesqldatabase.com',
    user: 'sql10780181',
    password: 'JKEaIv5vMH',
    database: 'sql10780181',
    port: 3306
});


db.connect(err => {
    if (err) {
        console.error('DB connection failed:', err);
    } else {
        console.log('Connected to MySQL database');
    }
});

app.get('/hello', (req, res) => {
    res.send('salve alphas');
});

app.post('/createaccount', (req, res) => {
    const { username, password } = req.body;
    console.log(username, password)
    db.query(
        'INSERT INTO usuarios (usu_NOME, usu_SENHA) VALUES (?, ?)',
        [username, password], (err, result) => {

        if (err) return res.status(500).json({ error: 'Failed to create account', details: err });
        res.status(201).json({ message: 'Account created'});
        
        }
    );
});

const jwt = require('jsonwebtoken');
app.get('/login', (req, res) => {
    let username = req.query.username;
    let password = req.query.password;

    if (username === '' || password === '') {
        return res.status(400).json('usuario ou senha vazios.');
    }

    db.query(
        'SELECT * FROM usuarios WHERE usu_NOME = ? AND usu_SENHA = ?',
        [username, password],
        (err, results) => {
            if (err) {
                console.log('login error:', err);
                return res.status(500).json({ error: 'Login failed', details: err });
            }

            if (results.length === 0) {
                return res.status(400).json({ error: 'Erro (1) Não encontrado.' });
            }

            const user = results[0];

            const token = jwt.sign(
                {
                    id: user.usu_ID,
                    nome: user.usu_NOME
                },
                SECRET_KEY,
                { expiresIn: '40h' }
            );

            return res.status(200).json({
                message: 'Sucesso',
                token,
                user: {
                    id: user.usu_ID,
                    nome: user.usu_NOME
                }
            });
        }
    );
});


app.get('/tarefas', verificarToken,  (req, res) => {
    let usuid = req.usuario.id
    db.query(`
        SELECT 
            trf_ID as id, 
            trf_TITULO as titulo, 
            trf_DESC as descricao 
        FROM 
            tarefas 
        WHERE 
            trf_USU = ${usuid}`, 
            
        (err, results) => {
            if (err) return res.status(400).json({ error: 'Erro ao carregar tarefas', details: err });

            return res.status(200).json(results);
        }
    );
});


app.post('/tarefas', verificarToken,  (req, res) => {
    const { titulo, descricao } = req.body;
    let usuario_id = req.usuario.id;
    db.query(`
        INSERT INTO 
            tarefas 
                (
                    trf_TITULO, 
                    trf_DESC, 
                    trf_USU
                ) 
        VALUES 
            (
                ?, 
                ?, 
                ?
            )`,
        [titulo, descricao, usuario_id],

        (result) => {
            return res.status(201).json( message = 'Tarefa created');
        },
        (err) => {
            return res.status(400).json({ error: 'Failed to add tarefa', details: err });
        }
    );
});


app.post('/tarefas/del', verificarToken,  (req, res) => {
    const id  = req.body.id;
    let usuario_id = req.usuario.id;
    db.query(`
        DELETE FROM 
            tarefas 
        WHERE 
            trf_ID = ${id} 
                AND 
                    trf_USU = ${usuario_id}`,

        (result) => {
            return res.status(200).json({ message: 'Tarefa deletada'});
        },
        (err) => {
            console.log('err update',err)
            return res.status(400).json({ error: 'Fail delete', details: err });
        }
    );
});

app.post('/tarefas/att', verificarToken,  (req, res) => {
    const { id, titulo, descricao } = req.body;

    db.query(`
        UPDATE 
            tarefas 
        SET 
            trf_TITULO = ?, 
            trf_DESC = ?
        WHERE 
            trf_ID = ?
                AND
                    trf_USU = ?
    `, [titulo, descricao, id, req.usuario.id],

        (result) => {
            return res.status(200).json( 'Tarefa updated' );
        },
        (err) => {
            console.log('err update',err)
            return res.status(400).json({ error: 'Failed to add tarefa', details: err });
        }
    );
});


app.get('/eu', verificarToken, (req, res) => {
    let usuid = req.usuario.id;

    db.query(`
        SELECT usu_ID as id, usu_NOME as nome FROM 
            usuarios 
        WHERE 
            usu_ID = ?`, 
        [usuid], 
        
        (err, results) => {

            if (err) return res.status(500).json({ error: 'Failed to fetch user', details: err });

            if (results.length === 0) return res.status(404).json({ error: 'User not found' });

            return res.json(results[0]);
        }
    );
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
