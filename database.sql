#DROP DATABASE IF EXISTS octoprint;
CREATE DATABASE IF NOT EXISTS octoprint;
USE octoprint;
CREATE TABLE if not exists customer(id varchar(36) PRIMARY KEY, name varchar(100));
CREATE TABLE if not exists users(id varchar(36) PRIMARY KEY, name varchar(25), pin varchar(5));
CREATE TABLE if not exists filesystem (id varchar(36) PRIMARY KEY, filename varchar(250), path varchar(1000), file_ext varchar(10), parent varchar(36), hashvalue varchar(128), size int, created int, updated int, changehash varchar(128)  UNIQUE KEY, type varchar(36));
CREATE TABLE if not exists fileinformation (id varchar(36), fileid VARCHAR(36), type VARCHAR(36), value VARCHAR(100), PRIMARY KEY (fileid, type));
CREATE TABLE if not exists types (id varchar(36) PRIMARY KEY, name varchar(100));
#Types should be called attributes
CREATE TABLE if not exists form_types (id varchar(36) PRIMARY KEY, name varchar(100), UNIQUE KEY (name));
CREATE TABLE if not exists form_types_to_attributes (id varchar(36), formid varchar(36), typeid varchar(36), PRIMARY KEY (formid, typeid));
INSERT IGNORE INTO users VALUES ("1", "admin", "1111");
INSERT IGNORE INTO filesystem VALUES ("ROOT", "uploads", "uploads", Null, Null, Null, Null, Null, True, Null, "folder");
INSERT IGNORE INTO filesystem VALUES ("POWDERS", "powders", "uploads/powders", Null, "ROOT", Null, Null, Null, True, Null, "folder");
INSERT IGNORE INTO filesystem VALUES ("PROJECTS", "projects", "uploads/projects", Null, "ROOT", Null, Null, Null, True, Null, "folder");
