import {Pool} from 'pg'

const pool = new Pool()
pool.query('SELECT * FROM users WHERE id = $1', [1], (err, res) => {
    if (err) {
        throw err
    }
    console.log('user:', res.rows[0])
})