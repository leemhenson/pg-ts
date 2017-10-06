import { Task } from "fp-ts/lib/Task";
import { get } from "lodash";
import { DbPool, DbResponseTransformer, Query, QueryTask } from ".";
import { any, none, one, oneOrMany, oneOrNone } from "./dbResponseTransformers";

type QueryFactory = (db: DbPool) => (transformer: DbResponseTransformer) => Query;
type QueryTaskFactory = (db: DbPool) => (transformer: DbResponseTransformer) => QueryTask;

const getQuery: QueryFactory = db => transformer => (query, txOpts) => {
  const pool = get(txOpts, "tx", db);

  // Quick hotfix for now (@hammer to do something smarter at a later date)
  pool.parsersReady = db.parsersReady;

  return pool
    .parsersReady
    .then(() => pool.query(query))
    .then(transformer);
};

const getQueryTask: QueryTaskFactory = db => transformer => (query, txOpts) =>
  new Task(() => {
    const pool = get(txOpts, "tx", db);

    // Quick hotfix for now (@hammer to do something smarter at a later date)
    pool.parsersReady = db.parsersReady;

    return pool
      .parsersReady
      .then(() => pool.query(query))
      .then(transformer);
  });

export default (db: DbPool): DbPool => {
  const transformQuery = getQuery(db);
  const transformQueryTask = getQueryTask(db);

  db.any = transformQuery(any);
  db.anyTask = transformQueryTask(any);

  db.none = transformQuery(none);
  db.noneTask = transformQueryTask(none);

  db.one = transformQuery(one);
  db.oneTask = transformQueryTask(one);

  db.oneOrMany = transformQuery(oneOrMany);
  db.oneOrManyTask = transformQueryTask(oneOrMany);

  db.oneOrNone = transformQuery(oneOrNone);
  db.oneOrNoneTask = transformQueryTask(oneOrNone);

  return db;
};
