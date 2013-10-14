package org.openbravo.service.datasource;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.hibernate.ScrollMode;
import org.hibernate.ScrollableResults;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.model.ad.datamodel.Column;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.ui.Tab;
import org.openbravo.model.ad.utility.TableTree;
import org.openbravo.model.ad.utility.Tree;
import org.openbravo.service.json.DataResolvingMode;
import org.openbravo.service.json.DataToJsonConverter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LinkToParentTreeDatasourceService extends TreeDatasourceService {
  final static Logger logger = LoggerFactory.getLogger(LinkToParentTreeDatasourceService.class);

  @Override
  protected void addNewNode(JSONObject bobProperties) {
    // Nothing needs to be done
  }

  @Override
  protected void deleteNode(JSONObject bobProperties) {
    try {
      String entityName = bobProperties.getString("_entity");
      Entity entity = ModelProvider.getInstance().getEntity(entityName);
      Table table = OBDal.getInstance().get(Table.class, entity.getTableId());
      Property linkToParentProperty = getLinkToParentProperty(table);
      Property nodeIdProperty = getNodeIdProperty(table);
      String bobParentNode = null;
      String bobNodeId = null;
      if (bobProperties.has(linkToParentProperty.getName())) {
        bobParentNode = bobProperties.getString(linkToParentProperty.getName());
      }
      if (bobProperties.has(nodeIdProperty.getName())) {
        bobNodeId = bobProperties.getString(nodeIdProperty.getName());
      }

      int nChildrenMoved = reparentChildrenOfDeletedNode(entity, bobParentNode, bobNodeId);
      logger.info(nChildrenMoved + " children have been moved to another parent");
    } catch (Exception e) {
      logger.error("Error while deleting tree node: ", e);
      throw new OBException("The node could not be deleted");
    }
  }

  public int reparentChildrenOfDeletedNode(Entity entity, String newParentId, String oldParentId) {
    int nChildrenMoved = -1;
    Table table = OBDal.getInstance().get(Table.class, entity.getTableId());
    Property linkToParentProperty = getLinkToParentProperty(table);
    Column linkToParentColumn = OBDal.getInstance().get(Column.class,
        linkToParentProperty.getColumnId());
    try {
      StringBuilder sql = new StringBuilder();
      sql.append(" UPDATE " + table.getDBTableName() + " ");
      if (newParentId == null) {
        sql.append(" set " + linkToParentColumn.getDBColumnName() + " = null ");
      } else {
        sql.append(" set " + linkToParentColumn.getDBColumnName() + " = ? ");
      }
      sql.append(" WHERE " + linkToParentColumn.getDBColumnName() + " = ? ");
      PreparedStatement ps = OBDal.getInstance().getConnection(false)
          .prepareStatement(sql.toString());

      if (newParentId == null) {
        ps.setString(1, oldParentId);
      } else {
        ps.setString(1, newParentId);
        ps.setString(2, oldParentId);
      }
      nChildrenMoved = ps.executeUpdate();
    } catch (SQLException e) {
      logger.error("Error while deleting tree node: ", e);
    }
    return nChildrenMoved;
  }

  private Property getLinkToParentProperty(Table table) {
    // TODO: Terminar. Soportar tablas con varios árboles asociados
    List<TableTree> tableTreeList = table.getADTableTreeList();
    if (tableTreeList.size() != 1) {
      return null;
    }
    TableTree tableTree = tableTreeList.get(0);
    Column linkToParentColumn = tableTree.getLinkToParentColumn();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    return entity.getPropertyByColumnName(linkToParentColumn.getDBColumnName());
  }

  private Property getNodeIdProperty(Table table) {
    // TODO: Terminar. Soportar tablas con varios árboles asociados
    List<TableTree> tableTreeList = table.getADTableTreeList();
    if (tableTreeList.size() != 1) {
      return null;
    }
    TableTree tableTree = tableTreeList.get(0);
    Column nodeIdColumn = tableTree.getNodeIdColumn();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    return entity.getPropertyByColumnName(nodeIdColumn.getDBColumnName());
  }

  private Property getLinkToParentProperty(Tab tab) {
    TableTree tableTree = tab.getTableTree();
    Column linkToParentColumn = tableTree.getLinkToParentColumn();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(tab.getTable().getId());
    return entity.getPropertyByColumnName(linkToParentColumn.getDBColumnName());
  }

  private Property getNodeIdProperty(Tab tab) {
    TableTree tableTree = tab.getTableTree();
    Column nodeIdColumn = tableTree.getNodeIdColumn();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(tab.getTable().getId());
    return entity.getPropertyByColumnName(nodeIdColumn.getDBColumnName());
  }

  @Override
  protected JSONArray fetchNodeChildren(Map<String, String> parameters, String parentId,
      String hqlWhereClause) throws JSONException {

    boolean fetchRoot = ROOT_NODE.equals(parentId);
    String tabId = parameters.get("tabId");
    Tab tab = OBDal.getInstance().get(Tab.class, tabId);
    Table table = tab.getTable();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    Property linkToParentProperty = getLinkToParentProperty(tab);
    Property nodeIdProperty = getNodeIdProperty(tab);
    StringBuilder whereClause = new StringBuilder();
    whereClause.append(" as e where e." + linkToParentProperty.getName());
    if (fetchRoot) {
      whereClause.append(" is null ");
    } else {
      whereClause.append(".id = '" + parentId + "' ");
    }

    if (hqlWhereClause != null) {
      whereClause.append(" and " + hqlWhereClause);
    }

    final OBQuery<BaseOBObject> query = OBDal.getInstance().createQuery(entity.getName(),
        whereClause.toString());

    final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
        DataToJsonConverter.class);

    JSONArray responseData = new JSONArray();

    final ScrollableResults scrollableResults = query.scroll(ScrollMode.FORWARD_ONLY);
    while (scrollableResults.next()) {
      BaseOBObject bob = (BaseOBObject) scrollableResults.get()[0];
      final JSONObject json = toJsonConverter.toJsonObject((BaseOBObject) bob,
          DataResolvingMode.FULL);
      json.put("parentId", parentId);
      String nodeId = (String) bob.get(nodeIdProperty.getName());
      json.put("nodeId", nodeId);
      json.put("_hasChildren", (this.nodeHasChildren(tab, bob)) ? true : false);
      responseData.put(json);

    }
    return responseData;
  }

  private boolean nodeHasChildren(Tab tab, BaseOBObject node) {
    Table table = tab.getTable();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    Property linkToParentProperty = getLinkToParentProperty(tab);
    Property nodeIdProperty = getNodeIdProperty(tab);
    String nodeId = (String) node.get(nodeIdProperty.getName());
    StringBuilder whereClause = new StringBuilder();
    whereClause.append(" where " + linkToParentProperty.getName());
    whereClause.append(".id = '" + nodeId + "' ");
    final OBQuery<BaseOBObject> query = OBDal.getInstance().createQuery(entity.getName(),
        whereClause.toString());

    return query.count() > 0;
  }

  private void recomputeSequenceNumbers(Tree tree, String newParentId, Long seqNo) {
  }

  protected JSONObject moveNode(Map<String, String> parameters, String nodeId, String newParentId,
      String prevNodeId, String nextNodeId) throws Exception {

    String referencedTableId = parameters.get("referencedTableId");
    Table table = OBDal.getInstance().get(Table.class, referencedTableId);
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    String tabId = parameters.get("tabId");
    Tab tab = OBDal.getInstance().get(Tab.class, tabId);
    Property linkToParentProperty = getLinkToParentProperty(tab);

    boolean isOrdered = tab.getTableTree().getTreeCategory().isOrdered();

    BaseOBObject bob = OBDal.getInstance().get(entity.getName(), nodeId);
    BaseOBObject parentBob = OBDal.getInstance().get(entity.getName(), newParentId);
    bob.set(linkToParentProperty.getName(), parentBob);

    OBDal.getInstance().flush();

    final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
        DataToJsonConverter.class);

    JSONObject updatedData = toJsonConverter.toJsonObject((BaseOBObject) bob,
        DataResolvingMode.FULL);
    BaseOBObject parent = (BaseOBObject) bob.get(linkToParentProperty.getName());
    updatedData.put("parentId", parentBob.getId().toString());
    updatedData.put("_hasChildren", (this.nodeHasChildren(tab, bob)) ? true : false);

    return updatedData;
  }

  private Long calculateSequenceNumberAndRecompute(Tree tree, String prevNodeId, String nextNodeId,
      String newParentId) throws Exception {
    return 0L;
  }

  @Override
  protected JSONObject getJSONObjectByNodeId(Map<String, String> parameters, String bobId) {
    String tabId = parameters.get("tabId");
    Tab tab = OBDal.getInstance().get(Tab.class, tabId);
    Table table = tab.getTable();
    Entity entity = ModelProvider.getInstance().getEntityByTableId(table.getId());
    Property linkToParentProperty = getLinkToParentProperty(tab);
    Property nodeIdProperty = getNodeIdProperty(tab);
    JSONObject json = null;

    final DataToJsonConverter toJsonConverter = OBProvider.getInstance().get(
        DataToJsonConverter.class);

    try {
      BaseOBObject bob = OBDal.getInstance().get(entity.getName(), bobId);
      json = toJsonConverter.toJsonObject((BaseOBObject) bob, DataResolvingMode.FULL);
      BaseOBObject parent = (BaseOBObject) bob.get(linkToParentProperty.getName());
      if (parent != null) {
        json.put("parentId", parent.getId().toString());
      } else {
        json.put("parentId", (String) null);
      }
      String nodeId = (String) bob.get(nodeIdProperty.getName());
      json.put("nodeId", nodeId);
      json.put("_hasChildren", (this.nodeHasChildren(tab, bob)) ? true : false);
    } catch (JSONException e) {
      logger.error("Error on tree datasource", e);
    }

    return json;
  }

}
