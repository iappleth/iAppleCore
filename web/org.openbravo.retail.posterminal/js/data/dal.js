/*global define,_,console,Backbone */

(function (d) {

  var dbSize = 50 * 1024 * 1024,
      undef, wsql = window.openDatabase !== undef,
      db = d || (wsql && window.openDatabase('WEBPOS', '0.1', 'Openbravo Web POS', dbSize)),
      OP;

  OP = {
    EQ: '=',
    CONTAINS: 'contains',
    STARTSWITH: 'startsWith',
    ENDSWITH: 'endsWith'
  };

  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toUpperCase();
  }

  function get_uuid() {
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4());
  }


  function transform(model, obj) {
    var tmp = {},
        modelProto = model.prototype,
        val;
    _.each(modelProto.properties, function (prop) {
      val = obj[modelProto.propertyMap[prop]];
      if (val === 'false') {
        tmp[prop] = false;
      } else if (val === 'true') {
        tmp[prop] = true;
      } else {
        tmp[prop] = val;
      }
    });
    return tmp;
  }

  function dbSuccess() {

  }

  function dbError() {
    if (window.console) {
      window.console.error(arguments);
    }
  }

  function find(model, whereClause, success, error, args) {
    var tableName = model.prototype.tableName,
        propertyMap = model.prototype.propertyMap,
        sql = 'SELECT * FROM ' + tableName,
        params = null,
        appendWhere = true,
        firstParam = true,
        k, v;

    if (db) {
      // websql
      if (whereClause && !_.isEmpty(whereClause)) {
        _.each(_.keys(whereClause), function (k) {

          var undef, val = whereClause[k],
              operator = (val !== null && val.operator !== undef) ? val.operator : '=',
              value = (val !== null && val.value !== undef) ? val.value : val;

          if (appendWhere) {
            sql = sql + ' WHERE ';
            params = [];
            appendWhere = false;
          }

          sql = sql + (firstParam ? '' : ' AND ') + ' ' + propertyMap[k] + ' ';

          if (value === null) {
            sql = sql + ' IS null ';
          } else {

            if (operator === OP.EQ) {
              sql = sql + ' = ? ';
            } else {
              sql = sql + ' like ? ';
            }

            if (operator === OP.CONTAINS) {
              value = '%' + value + '%';
            } else if (operator === OP.STARTSWITH) {
              value = '%' + value;
            } else if (operator === OP.ENDSWITH) {
              value = value + '%';
            }
            params.push(value);
          }

          if (firstParam) {
            firstParam = false;
          }

        });
      }

      //console.log(sql);
      //console.log(params);
      db.readTransaction(function (tx) {
        tx.executeSql(sql, params, function (tr, result) {
          var i, collectionType = OB.Collection[model.prototype.modelName + 'List'] || Backbone.Collection,
              collection = new collectionType(),
              len = result.rows.length;
          if (len === 0) {
            success(null, args);
          } else {
            for (i = 0; i < len; i++) {
              collection.add(transform(model, result.rows.item(i)));
            }
            success(collection, args);
          }
        }, error);
      });
    } else {
      // localStorage
      throw 'Not implemented';
    }
  }

  function save(model, success, error) {
    var modelProto = model.constructor.prototype,
        tableName = modelProto.tableName,
        sql = '',
        params = null,
        firstParam = true,
        uuid, propertyName;

    if (db) {
      // websql
      if (!tableName) {
        throw 'Missing table name in model';
      }

      if (model.get('id')) {
        // UPDATE
        sql = 'UPDATE ' + tableName + ' SET ';

        _.each(_.keys(modelProto.properties), function (attr) {
          propertyName = modelProto.properties[attr];
          if (attr === 'id') {
            return;
          }

          if (firstParam) {
            firstParam = false;
            params = [];
          } else {
            sql = sql + ', ';
          }
          

          sql = sql + modelProto.propertyMap[propertyName] + ' = ? ';

          params.push(model.get(propertyName));
        });

        sql = sql + ' WHERE ' + tableName + '_id = ?';
        params.push(model.get('id'));
      } else {
        // INSERT
        params = [];
        sql = modelProto.insertStatement;
        uuid = get_uuid();
        params.push(uuid);
        model.set('id', uuid);

        _.each(modelProto.properties, function (property) {
          if ('id' === property) {
            return;
          }
          params.push(model.get(property) === undefined ? null : model.get(property));
        });
        //console.log(params.length);
      }

      //console.log(sql);
      //console.log(params);
      db.transaction(function (tx) {
        tx.executeSql(sql, params, success, error);
      });
    } else {
      throw 'Not implemented';
    }
  }

  function remove(model, success, error) {
    var modelProto = model.constructor.prototype,
        tableName = modelProto.tableName,
        sql = '',
        params = [];

    if (db) {
      // websql
      if (!tableName) {
        throw 'Missing table name in model';
      }

      if (model.get('id')) {
        // UPDATE
        sql = 'DELETE FROM ' + tableName + ' WHERE '+modelProto.propertyMap.id+' = ? ';
        params.push(model.get('id'));
      } else {
        throw 'An object without id cannot be deleted';
      }

      //console.log(sql);
      //console.log(params);
      db.transaction(function (tx) {
        tx.executeSql(sql, params, success, error);
      });
    } else {
      throw 'Not implemented';
    }
  }
  
  function get(model, id, success, error) {
    var tableName = model.prototype.tableName,
        sql = 'SELECT * FROM ' + tableName + ' WHERE ' + tableName + '_id = ?';

    if (db) {
      // websql
      db.readTransaction(function (tx) {
        tx.executeSql(sql, [id], function (tr, result) {
          if (result.rows.length === 0) {
            return null;
          } else {
            success(new model(transform(model, result.rows.item(0))));
          }
        }, error);
      });
    } else {
      // localStorage
      throw 'Not implemented';
    }
  }

  function initCache(model, initialData, success, error) {

    if (db) {
      if (!model.prototype.createStatement || !model.prototype.dropStatement) {
        throw 'Model requires a create and drop statement';
      }

      if (!initialData) {
        throw 'initialData must be passed as parameter';
      }

      if(!model.prototype.local) {
        db.transaction(function (tx) {
          tx.executeSql(model.prototype.dropStatement);
        }, error);
      }

      db.transaction(function (tx) {
        tx.executeSql(model.prototype.createStatement);
      }, error);

      if (_.isArray(initialData)) {
        db.transaction(function (tx) {
          var props = model.prototype.properties,
              propMap = model.prototype.propertyMap,
              values, _idx = 0;

          _.each(initialData, function (item) {
            values = [];

            _.each(props, function (propName) {
              if ('_idx' === propName) {
                return;
              }
              values.push(item[propName]);
            });
            values.push(_idx);

            tx.executeSql(model.prototype.insertStatement, values, null, error);
            _idx++;
          });
        }, error, function () {
          // transaction success, execute callback
          if (_.isFunction(success)) {
            success();
          }
        });
      } else { // no initial data
        throw 'initialData must be an Array';
      }
    } else {
      throw 'Not implemented';
    }

  }

  window.OB = window.OB || {};

  window.OB.Dal = {
    // constants
    EQ: OP.EQ,
    CONTAINS: OP.CONTAINS,
    STARTSWITH: OP.STARTSWITH,
    ENDSWITH: OP.ENDSWITH,
    // methods
    save: save,
    find: find,
    get: get,
    remove: remove,
    initCache: initCache
  };
}(OB && OB.DATA && OB.DATA.OfflineDB));