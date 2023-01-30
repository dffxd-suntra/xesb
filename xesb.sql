--
-- SQLiteStudio v3.4.3 生成的文件，周一 1月 30 21:01:43 2023
--
-- 所用的文本编码：System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- 表：comments
CREATE TABLE IF NOT EXISTS comments (
    gid            INTEGER,
    id             INTEGER,
    comments_index INTEGER,
    score          INTEGER,
    postTime       DATETIME,
    type           INTEGER,
    uploder_name   TEXT,
    uploder_url    TEXT,
    content        TEXT,
    reg_date       DATETIME DEFAULT (CURRENT_TIMESTAMP),
    PRIMARY KEY (
        gid ASC,
        id ASC
    )
);


-- 表：gallerys
CREATE TABLE IF NOT EXISTS gallerys (
    url           TEXT,
    mainName      TEXT,
    secondaryName TEXT,
    cover         TEXT,
    pages         INTEGER,
    categories    TEXT,
    uploader      TEXT,
    uploaderUrl   TEXT,
    parent        INTEGER,
    parentUrl     INTEGER,
    language      TEXT,
    isTranslation BOOLEAN,
    postTime      DATETIME,
    visible       BOOLEAN,
    fileSize      DOUBLE,
    favorited     INTEGER,
    favorites     TEXT,
    torrentNum    INTEGER,
    rating        DOUBLE,
    ragingCount   INTEGER,
    gid           INTEGER,
    token         TEXT,
    reg_date      DATETIME DEFAULT (CURRENT_TIMESTAMP),
    PRIMARY KEY (
        gid ASC
    )
);


-- 表：pics
CREATE TABLE IF NOT EXISTS pics (
    id        INTEGER  PRIMARY KEY ASC AUTOINCREMENT,
    fileIndex INTEGER,
    name      TEXT,
    type      TEXT,
    size      INTEGER,
    height    INTEGER,
    width     INTEGER,
    reg_date  DATETIME DEFAULT (CURRENT_TIMESTAMP) 
);


-- 表：relationships
CREATE TABLE IF NOT EXISTS relationships (
    pid      INTEGER,
    gid      INTEGER,
    page     INTEGER,
    reg_date DATETIME DEFAULT (CURRENT_TIMESTAMP),
    PRIMARY KEY (
        pid,
        gid,
        page ASC
    )
);


-- 表：tags
CREATE TABLE IF NOT EXISTS tags (
    gid        INTEGER,
    categories TEXT,
    credit     INTEGER,
    name       TEXT,
    url        TEXT,
    reg_date   DATETIME DEFAULT (CURRENT_TIMESTAMP),
    PRIMARY KEY (
        gid ASC,
        categories ASC,
        name ASC
    )
);


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
