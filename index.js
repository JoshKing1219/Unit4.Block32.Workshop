const express = require("express");
const pg = require("pg");

const server = express();

const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_ice_cream"
);

const init = async () => {
  await client.connect();
  console.log("connected to database");

  let SQL = `
        DROP TABLE IF EXISTS flavors;
        CREATE TABLE flavors(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100),
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT now(),
            updated_at TIMESTAMP DEFAULT now()
        )
    `;
  await client.query(SQL);
  console.log("table created");

  SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('Mint Chocolate Chip', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Moose Tracks', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Pistachio', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Kit-Kat', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Strawberry Cheesecake', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Vanilla Bean', true);
    INSERT INTO flavors(name, is_favorite) VALUES('Neopolitan', false);
    INSERT INTO flavors(name, is_favorite) VALUES('Cookies and Cream', true);
  `;
  await client.query(SQL);
  console.log("seeded data");

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
};

init();

server.use(express.json());
server.use(require("morgan")("dev"));

server.get("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `SELECT * from flavors ORDER BY name ASC`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

server.get("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM flavors WHERE id=$1`;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows);
  } catch (error) {
    next(error);
  }
});

server.post("/api/flavors", async (req, res, next) => {
  try {
    const SQL = `INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *;`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
    ]);
    res.status(201).send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});

server.delete("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `DELETE FROM flavors WHERE id=$1`;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

server.put("/api/flavors/:id", async (req, res, next) => {
  try {
    const SQL = `UPDATE flavors SET name=$1, is_favorite=$2,
        updated_at=now() WHERE id=$3 RETURNING *;`;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (error) {
    next(error);
  }
});
