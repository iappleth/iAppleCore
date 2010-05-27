/*
 *************************************************************************
 * The contents of this file are subject to the Openbravo  Public  License
 * Version  1.0  (the  "License"),  being   the  Mozilla   Public  License
 * Version 1.1  with a permitted attribution clause; you may not  use this
 * file except in compliance with the License. You  may  obtain  a copy of
 * the License at http://www.openbravo.com/legal/license.html
 * Software distributed under the License  is  distributed  on  an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific  language  governing  rights  and  limitations
 * under the License.
 * The Original Code is Openbravo ERP.
 * The Initial Developer of the Original Code is Openbravo SLU
 * All portions are Copyright (C) 2010 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */
package org.openbravo.erpCommon.businessUtility;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Set;

import org.apache.log4j.Logger;
import org.hibernate.criterion.Expression;
import org.hibernate.criterion.Order;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.session.OBPropertiesProvider;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.erpCommon.utility.Utility;
import org.openbravo.model.ad.access.Role;
import org.openbravo.model.ad.access.RoleOrganization;
import org.openbravo.model.ad.access.User;
import org.openbravo.model.ad.access.UserRoles;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.domain.Reference;
import org.openbravo.model.ad.module.ADClientModule;
import org.openbravo.model.ad.module.Module;
import org.openbravo.model.ad.system.Client;
import org.openbravo.model.ad.system.ClientInformation;
import org.openbravo.model.ad.system.Language;
import org.openbravo.model.ad.system.SystemInformation;
import org.openbravo.model.ad.utility.DataSet;
import org.openbravo.model.ad.utility.Image;
import org.openbravo.model.ad.utility.Sequence;
import org.openbravo.model.ad.utility.Tree;
import org.openbravo.model.ad.utility.TreeNode;
import org.openbravo.model.common.currency.Currency;
import org.openbravo.model.common.enterprise.DocumentTemplate;
import org.openbravo.model.common.enterprise.DocumentType;
import org.openbravo.model.common.enterprise.EmailTemplate;
import org.openbravo.model.common.enterprise.Organization;
import org.openbravo.model.common.enterprise.OrganizationAcctSchema;
import org.openbravo.model.financialmgmt.accounting.coa.AccountingCombination;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchema;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaDefault;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaElement;
import org.openbravo.model.financialmgmt.accounting.coa.AcctSchemaGL;
import org.openbravo.model.financialmgmt.accounting.coa.Element;
import org.openbravo.model.financialmgmt.accounting.coa.ElementValue;
import org.openbravo.model.financialmgmt.accounting.coa.ElementValueOperand;
import org.openbravo.model.financialmgmt.calendar.Calendar;
import org.openbravo.model.financialmgmt.calendar.Year;
import org.openbravo.model.financialmgmt.gl.GLCategory;
import org.openbravo.service.db.DataImportService;
import org.openbravo.service.db.ImportResult;

/**
 * @author David Alsasua
 * 
 *         Initial Client Setup Utility class
 */
public class InitialSetupUtility {
  static Logger log4j = Logger.getLogger(InitialSetupUtility.class);

  // TODO: add log and security check of provided parameters to all functions.
  // TODO: change throw Exception for more specific one (HibernateException)??
  // TODO: Add flush parameter to every public function
  public static boolean existsClientName(String strClient) throws Exception {
    final OBCriteria<Client> obcClient = OBDal.getInstance().createCriteria(Client.class);
    obcClient.add(Expression.eq(Client.PROPERTY_NAME, strClient));
    return (obcClient.list().size() > 0);
  }

  public static boolean existsUserName(String strUser) throws Exception {
    final OBCriteria<User> obcClient = OBDal.getInstance().createCriteria(User.class);
    obcClient.add(Expression.eq(Client.PROPERTY_NAME, strUser));
    return (obcClient.list().size() > 0);
  }

  public static Client insertClient(String strClientName, String strCurrency) throws Exception {

    log4j.debug("InitialSetupUtility - insertClient() - clientName = " + strClientName);
    Currency currency = getCurrency(strCurrency);
    final Client newClient = OBProvider.getInstance().get(Client.class);
    newClient.setCurrency(currency);
    newClient.setSearchKey(strClientName);
    newClient.setName(strClientName);
    newClient.setDescription(strClientName);
    newClient.setNewOBObject(true);
    OBDal.getInstance().save(newClient);
    OBDal.getInstance().flush();
    return newClient;
  }

  public static Currency getCurrency(String strCurrencyID) throws Exception {
    final OBCriteria<Currency> obcCurrency = OBDal.getInstance().createCriteria(Currency.class);
    obcCurrency.add(Expression.eq(Currency.PROPERTY_ID, strCurrencyID));
    if (obcCurrency.list().size() > 0)
      return obcCurrency.list().get(0);
    else
      return null;
  }

  public static Language getLanguage(String strLanguage) throws Exception {
    final OBCriteria<Language> obcLanguage = OBDal.getInstance().createCriteria(Language.class);
    obcLanguage.add(Expression.eq(Language.PROPERTY_LANGUAGE, strLanguage));
    if (obcLanguage.list().size() > 0)
      return obcLanguage.list().get(0);
    else
      return null;
  }

  /**
   * Returns the relation of trees defined in the reference list of the application dictionary
   * called AD_TreeType Type
   * 
   * @return java.util.List<org.openbravo.model.ad.domain.List>: the relation of AD list elements
   */
  public static List<org.openbravo.model.ad.domain.List> treeRelation() throws Exception {

    final OBCriteria<org.openbravo.model.ad.domain.Reference> obcReference = OBDal.getInstance()
        .createCriteria(org.openbravo.model.ad.domain.Reference.class);
    obcReference.add(Expression.eq(org.openbravo.model.ad.domain.Reference.PROPERTY_NAME,
        "AD_TreeType Type"));
    List<org.openbravo.model.ad.domain.Reference> listReferences = obcReference.list();
    if (listReferences.size() != 1)
      return null;

    org.openbravo.model.ad.domain.Reference referenceTree = listReferences.get(0);
    final OBCriteria<org.openbravo.model.ad.domain.List> obcRefTreeList = OBDal.getInstance()
        .createCriteria(org.openbravo.model.ad.domain.List.class);
    obcRefTreeList.add(Expression.eq(org.openbravo.model.ad.domain.List.PROPERTY_REFERENCE,
        referenceTree));
    obcRefTreeList.addOrder(Order.asc("name"));
    return obcRefTreeList.list();
  }

  public static Tree getSystemMenuTree(String strTreeTypeMenu) throws Exception {
    final OBCriteria<Tree> obcTree = OBDal.getInstance().createCriteria(Tree.class);
    obcTree.add(Expression.eq(Tree.PROPERTY_TYPEAREA, strTreeTypeMenu));
    List<Tree> lTrees = obcTree.list();
    if (lTrees.size() != 1)
      return null;
    return lTrees.get(0);
  }

  public static Tree insertTree(Client client, String name, String treeType, Boolean boIsAllNodes)
      throws Exception {
    final Tree newTree = OBProvider.getInstance().get(Tree.class);
    newTree.setClient(client);
    newTree.setName(name);
    newTree.setDescription(name);
    newTree.setTypeArea(treeType);
    newTree.setAllNodes(boIsAllNodes);
    OBDal.getInstance().save(newTree);
    OBDal.getInstance().flush();
    return newTree;
  }

  public static ClientInformation insertClientinfo(Client client, Tree menuTree, Tree orgTree,
      Tree bpartnerTree, Tree projectTree, Tree salesRegionTree, Tree productTree,
      Boolean boDiscountCalculatedFromLineAmounts) throws Exception {
    final ClientInformation newClientInfo = OBProvider.getInstance().get(ClientInformation.class);
    newClientInfo.setClient(client);
    newClientInfo.setPrimaryTreeMenu(menuTree);
    newClientInfo.setPrimaryTreeOrganization(orgTree);
    newClientInfo.setPrimaryTreeBPartner(bpartnerTree);
    newClientInfo.setPrimaryTreeProject(projectTree);
    newClientInfo.setPrimaryTreeSalesRegion(salesRegionTree);
    newClientInfo.setPrimaryTreeProduct(productTree);
    newClientInfo.setDiscountCalculatedFromLineAmounts(boDiscountCalculatedFromLineAmounts);
    OBDal.getInstance().save(newClientInfo);
    OBDal.getInstance().flush();
    return newClientInfo;
  }

  public static boolean setClientInformation(Client client, ClientInformation clientInfo)
      throws Exception {
    boolean boResult = client.getClientInformationList().add(clientInfo);
    OBDal.getInstance().save(client);
    OBDal.getInstance().flush();
    return boResult;
  }

  public static void setClientImages(Client client) throws Exception {
    SystemInformation sys = OBDal.getInstance().get(SystemInformation.class, "0");
    setYourCompanyBigImage(sys, client);
    setYourCompanyDocumentImage(sys, client);
    setYourCompanyMenuImage(sys, client);
    return;
  }

  public static void setYourCompanyBigImage(SystemInformation sys, Client client) {
    Image yourCompanyBigImage = OBProvider.getInstance().get(Image.class);
    Image systemCompanyBigImage = sys.getYourCompanyBigImage();
    if (systemCompanyBigImage != null) {
      yourCompanyBigImage.setClient(client);
      yourCompanyBigImage.setBindaryData(systemCompanyBigImage.getBindaryData());
      yourCompanyBigImage.setName(systemCompanyBigImage.getName());
      client.getClientInformationList().get(0).setYourCompanyBigImage(yourCompanyBigImage);
      OBDal.getInstance().save(yourCompanyBigImage);
      OBDal.getInstance().flush();
    }
    return;
  }

  public static void setYourCompanyDocumentImage(SystemInformation sys, Client client) {
    Image yourCompanyDocumentImage = OBProvider.getInstance().get(Image.class);
    if (sys.getYourCompanyDocumentImage() != null) {
      yourCompanyDocumentImage.setClient(client);
      yourCompanyDocumentImage.setBindaryData(sys.getYourCompanyDocumentImage().getBindaryData());
      yourCompanyDocumentImage.setName(sys.getYourCompanyBigImage().getName());
      client.getClientInformationList().get(0)
          .setYourCompanyDocumentImage(yourCompanyDocumentImage);
      OBDal.getInstance().save(yourCompanyDocumentImage);
      OBDal.getInstance().flush();
    }
    return;
  }

  public static void setYourCompanyMenuImage(SystemInformation sys, Client client) {
    Image yourCompanyMenuImage = OBProvider.getInstance().get(Image.class);
    if (sys.getYourCompanyMenuImage() != null) {
      yourCompanyMenuImage.setClient(client);
      yourCompanyMenuImage.setBindaryData(sys.getYourCompanyMenuImage().getBindaryData());
      yourCompanyMenuImage.setName(sys.getYourCompanyMenuImage().getName());
      client.getClientInformationList().get(0).setYourCompanyMenuImage(yourCompanyMenuImage);
      OBDal.getInstance().save(yourCompanyMenuImage);
      OBDal.getInstance().flush();
    }
    return;
  }

  /**
   * 
   * @param client
   *          client for which the role will be created
   * @param orgProvided
   *          if null, role inserted for organization with id=0
   * @param name
   *          name of the role
   * @param strUserLevel
   *          if null, user level " CO" will be set to the new role
   * @return
   */
  public static Role insertRole(Client client, Organization orgProvided, String name,
      String strUserLevelProvided) throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    String strUserLevel;
    if (strUserLevelProvided == null || strUserLevelProvided == "")
      strUserLevel = " CO";
    else
      strUserLevel = strUserLevelProvided;

    final Role newRole = OBProvider.getInstance().get(Role.class);
    newRole.setClient(client);
    newRole.setOrganization(organization);
    newRole.setName(name);
    newRole.setDescription(name);
    newRole.setClientList(client.getId());
    newRole.setOrganizationList(organization.getId());
    newRole.setUserLevel(strUserLevel);
    OBDal.getInstance().save(newRole);
    OBDal.getInstance().flush();
    return newRole;
  }

  /**
   * 
   * @param role
   *          role for which the organization access information will be created
   * @param orgProvided
   *          if null, organization with id "0" will be used
   * @return
   */
  public static RoleOrganization insertRoleOrganization(Role role, Organization orgProvided)
      throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;

    final RoleOrganization newRoleOrganization = OBProvider.getInstance().get(
        RoleOrganization.class);
    newRoleOrganization.setClient(role.getClient());
    newRoleOrganization.setOrganization(organization);
    newRoleOrganization.setRole(role);
    OBDal.getInstance().save(newRoleOrganization);
    OBDal.getInstance().flush();
    return newRoleOrganization;
  }

  public static User insertUser(Client client, Organization orgProvided, String name,
      String password, Role role, Language defaultLanguage) throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;

    final User newUser = OBProvider.getInstance().get(User.class);
    newUser.setClient(client);
    newUser.setOrganization(organization);
    newUser.setName(name);
    newUser.setDescription(name);
    newUser.setUsername(name);
    newUser.setPassword(password);
    newUser.setDefaultLanguage(defaultLanguage);
    newUser.setDefaultRole(role);
    OBDal.getInstance().save(newUser);
    OBDal.getInstance().flush();
    return newUser;
  }

  public static UserRoles insertUserRole(Client client, User user, Organization orgProvided,
      Role role) throws Exception {
    // TODO: update to MP16 the repository and change this try/catch by new stuff:
    // wiki.openbravo.com/wiki/ERP/2.50/Developers_Guide/Concepts/Data_Access_Layer#Administrator_Mode
    final boolean prevMode = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      Organization organization = null;

      if (orgProvided == null) {
        if ((organization = getZeroOrg()) == null)
          return null;
      } else
        organization = orgProvided;

      final UserRoles newUserRole = OBProvider.getInstance().get(UserRoles.class);
      newUserRole.setClient(client);
      newUserRole.setOrganization(organization);
      newUserRole.setRole(role);
      newUserRole.setUserContact(user);
      OBDal.getInstance().save(newUserRole);
      OBDal.getInstance().flush();
      return newUserRole;
    } finally {
      OBContext.getOBContext().setInAdministratorMode(prevMode);
    }

  }

  public static void insertUserRoles(Client client, User user, Organization organization, Role role)
      throws Exception {
    // ClientUser - Admin & User
    insertUserRole(client, user, organization, role);
    // SuperUser(100) - Admin & User
    insertUserRole(client, OBDal.getInstance().get(User.class, "100"), organization, role);
    return;
  }

  public static Calendar insertCalendar(Client client, Organization orgProvided, String name)
      throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;

    final Calendar newCalendar = OBProvider.getInstance().get(Calendar.class);
    newCalendar.setClient(client);
    newCalendar.setOrganization(organization);
    newCalendar.setName(name);
    OBDal.getInstance().save(newCalendar);
    OBDal.getInstance().flush();
    return newCalendar;
  }

  private static Organization getZeroOrg() {
    final OBCriteria<Organization> obcOrg = OBDal.getInstance().createCriteria(Organization.class);
    obcOrg.add(Expression.eq(Organization.PROPERTY_ID, "0"));
    List<Organization> lOrgs = obcOrg.list();
    if (lOrgs.size() == 1)
      return lOrgs.get(0);
    else
      return null;
  }

  public static Year insertYear(Client client, Organization orgProvided, Calendar calendar,
      String strYearName) throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    final Year newYear = OBProvider.getInstance().get(Year.class);
    newYear.setClient(client);
    newYear.setOrganization(organization);
    newYear.setCalendar(calendar);
    newYear.setFiscalYear(strYearName);
    OBDal.getInstance().save(newYear);
    OBDal.getInstance().flush();
    return newYear;
  }

  public static Element insertElement(Client client, Organization orgProvided, String name,
      Tree accountTree, Boolean bNaturalAccount) throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    final Element newElement = OBProvider.getInstance().get(Element.class);
    newElement.setClient(client);
    newElement.setOrganization(organization);
    newElement.setName(name);
    newElement.setDescription(name);
    newElement.setTree(accountTree);
    newElement.setNaturalAccount(bNaturalAccount);
    OBDal.getInstance().save(newElement);
    OBDal.getInstance().flush();
    return newElement;
  }

  public static ElementValue insertElementValue(Element element, Organization orgProvided,
      String name, String value, String description, String accountType, String accountSign,
      boolean isDocControlled, boolean isSummary, String elementLevel, boolean doFlush)
  // TODO: replace boolean doFlush by an int with the amount of iterations between each flush
      throws Exception {

    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;

    final ElementValue newElementValue = OBProvider.getInstance().get(ElementValue.class);
    newElementValue.setClient(element.getClient());
    newElementValue.setOrganization(organization);
    newElementValue.setSearchKey(value);
    newElementValue.setName(name);
    newElementValue.setDescription(description);
    newElementValue.setAccountingElement(element);
    newElementValue.setAccountType(accountType);
    newElementValue.setAccountSign(accountSign);
    newElementValue.setDocumentControlled(isDocControlled);
    newElementValue.setSummaryLevel(isSummary);
    newElementValue.setElementLevel(elementLevel);
    OBDal.getInstance().save(newElementValue);
    if (doFlush)
      OBDal.getInstance().flush();
    return newElementValue;
  }

  /**
   * 
   * @param treeAccount
   * @param mapSequence
   *          HasMap<String,Long> where 1st argument (String) belongs to the value of one element
   *          value, and 2nd argument (Long) belongs to its sequenceNumber value in ADTreeNode
   * @return
   * @throws Exception
   */
  public static List<TreeNode> getTreeNode(Tree accountTree, Client client) throws Exception {
    // TODO: update to MP16 the repository and change this try/catch by new stuff:
    // wiki.openbravo.com/wiki/ERP/2.50/Developers_Guide/Concepts/Data_Access_Layer#Administrator_Mode
    final boolean prevMode = OBContext.getOBContext().setInAdministratorMode(true);
    List<TreeNode> lTreeNodes;
    try {
      final OBCriteria<TreeNode> obcTreeNode = OBDal.getInstance().createCriteria(TreeNode.class);
      obcTreeNode.add(Expression.eq(TreeNode.PROPERTY_TREE, accountTree));
      obcTreeNode.add(Expression.eq(TreeNode.PROPERTY_CLIENT, client));
      if (OBContext.getOBContext().isInAdministratorMode()) {
        obcTreeNode.setFilterOnReadableClients(false);
        obcTreeNode.setFilterOnReadableOrganization(false);
      }
      lTreeNodes = obcTreeNode.list();
    } catch (Exception e) {
      OBContext.getOBContext().setInAdministratorMode(prevMode);
      return null;
    } finally {
      OBContext.getOBContext().setInAdministratorMode(prevMode);
    }
    return lTreeNodes;
  }

  /**
   * Sorts the account tree (stored in ADTreeNode) according to the order provided
   * 
   * @param treeNodes
   *          relation of nodes in ADTreeNode belonging to the accounting tree to sort out
   * @param mapSequence
   *          HashMap<String,Long> where the String belongs to the value of a c_elementvalue, and
   *          Long to the sequence that must be assigned to the node that represents that element
   *          value in ADTreeNode
   * @param mapElementValueValue
   *          each tree node in treeNodes has one entry in mapElementValueId to link it's value with
   *          the c_elementvalue_id of that element in c_elementvalue table
   * @param mapElementValueId
   *          stores the link value <-> c_elementvalue_id
   * @param mapParent
   *          stores the link value <-> value of the parent
   * @param doFlush
   *          if true, each new update performs a flush in DAL
   * @throws Exception
   */
  public static void updateAccountTree(List<TreeNode> treeNodes, HashMap<String, Long> mapSequence,
      HashMap<String, String> mapElementValueValue, HashMap<String, String> mapElementValueId,
      HashMap<String, String> mapParent, boolean doFlush) throws Exception {
    // TODO: replace boolean doFlush by an int with the amount of iterations between each flush
    Iterator<TreeNode> iTreeNodes = treeNodes.listIterator();
    while (iTreeNodes.hasNext()) {
      try {
        TreeNode treeNode = iTreeNodes.next();
        String strElementId = treeNode.getNode();
        String strElementValue = "0";
        Long lSequence = 10L;
        if (!strElementId.equals("0")) {
          strElementValue = mapElementValueValue.get(strElementId);
          lSequence = mapSequence.get(strElementValue);
          treeNode.setSequenceNumber(lSequence);
          String strParentValue = mapParent.get(strElementValue);
          if (!strParentValue.equals("0"))
            treeNode.setReportSet(mapElementValueId.get(strParentValue));
          OBDal.getInstance().save(treeNode);
        }
        if (doFlush)
          OBDal.getInstance().flush();
      } catch (Exception ignoredException) {
        log4j.error("updateAccountTree() - Ignored exception while sorting account tree.",
            ignoredException);
      }
    }
  }

  //
  // /**
  // *
  // * @param accountTree
  // * @param parent
  // * if null, then sequence number of node 0 for that tree + 10 is retrieved
  // * @return
  // */
  // @SuppressWarnings("unchecked")
  // private static Long getNextSeqNo(Tree accountTree, ElementValue parent) {
  // final StringBuilder sql = new StringBuilder();
  //
  // sql.append(" select max(tn.sequenceNumber)");
  // sql.append(" from ADTreeNode tn");
  // sql.append(" where tn.tree='" + accountTree.getId() + "'");
  // if (parent == null)
  // sql.append(" and tn.reportSet='0'");
  // else
  // sql.append(" and tn.reportSet='" + parent.getId() + "'");
  //
  // final Session session = OBDal.getInstance().getSession();
  // final Query query = session.createQuery(sql.toString());
  // List lOut = query.list();
  //
  // return new Long(lOut.get(0).toString());
  // }
  //
  // public static void updateTreeNode(TreeNode treenode, ElementValue parent, Long sequence) {
  // if (parent != null)
  // treenode.setReportSet(parent.getId());
  // treenode.setSequenceNumber(sequence);
  // }
  //
  // public static ElementValue getElementValue(Element element, String strAccountParentKey) {
  // final boolean prevMode = OBContext.getOBContext().setInAdministratorMode(true);
  //
  // List<ElementValue> lAccount = null;
  // try {
  // final OBCriteria<ElementValue> obcAccount = OBDal.getInstance().createCriteria(
  // ElementValue.class);
  // // TODO: update to MP16 the repository and change this try/catch by new stuff:
  // //
  // http://wiki.openbravo.com/wiki/ERP/2.50/Developers_Guide/Concepts/Data_Access_Layer#Administrator_Mode
  // if (OBContext.getOBContext().isInAdministratorMode()) {
  // obcAccount.setFilterOnReadableClients(false);
  // obcAccount.setFilterOnReadableOrganization(false);
  // }
  // obcAccount.add(Expression.eq(ElementValue.PROPERTY_ACCOUNTINGELEMENT, element));
  // obcAccount.add(Expression.eq(ElementValue.PROPERTY_SEARCHKEY, strAccountParentKey));
  // lAccount = obcAccount.list();
  // } finally {
  // OBContext.getOBContext().setInAdministratorMode(prevMode);
  // }
  // if (lAccount.size() == 1)
  // return lAccount.get(0);
  // else
  // return null;
  // }

  public static ElementValueOperand insertOperand(ElementValue elementValue, ElementValue operand,
      Long sign, Long sequence) throws Exception {
    final ElementValueOperand newElementValueOperand = OBProvider.getInstance().get(
        ElementValueOperand.class);
    newElementValueOperand.setClient(elementValue.getClient());
    newElementValueOperand.setOrganization(elementValue.getOrganization());
    newElementValueOperand.setSign(sign);
    newElementValueOperand.setSequenceNumber(sequence);
    newElementValueOperand.setAccountElement(operand);
    newElementValueOperand.setAccount(elementValue);
    OBDal.getInstance().save(newElementValueOperand);
    OBDal.getInstance().flush();
    return newElementValueOperand;
  }

  public static ElementValue getElementValue(Element element, String value) throws Exception {
    // TODO: update to MP16 the repository and change this try/catch by new stuff:
    // wiki.openbravo.com/wiki/ERP/2.50/Developers_Guide/Concepts/Data_Access_Layer#Administrator_Mode
    final boolean prevMode = OBContext.getOBContext().setInAdministratorMode(true);
    try {
      final OBCriteria<ElementValue> obcEV = OBDal.getInstance().createCriteria(ElementValue.class);
      if (OBContext.getOBContext().isInAdministratorMode()) {
        obcEV.setFilterOnReadableClients(false);
        obcEV.setFilterOnReadableOrganization(false);
      }
      obcEV.add(Expression.eq(ElementValue.PROPERTY_SEARCHKEY, value));
      obcEV.add(Expression.eq(ElementValue.PROPERTY_ACCOUNTINGELEMENT, element));
      if (obcEV == null)
        return null;
      List<ElementValue> l = obcEV.list();
      if (l.size() != 1)
        return null;
      return l.get(0);
    } catch (Exception e) {
      OBContext.getOBContext().setInAdministratorMode(prevMode);
      return null;
    } finally {
      OBContext.getOBContext().setInAdministratorMode(prevMode);
    }
  }

  public static AcctSchema insertAcctSchema(Client client, Organization orgProvided,
      Currency currency, String name, String gAAP, String costingMethod, boolean hasAlias)
      throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    final AcctSchema newAcctSchema = OBProvider.getInstance().get(AcctSchema.class);
    newAcctSchema.setClient(client);
    newAcctSchema.setOrganization(organization);
    newAcctSchema.setCurrency(currency);
    newAcctSchema.setName(name);
    newAcctSchema.setGAAP(gAAP);
    newAcctSchema.setCostingMethod(costingMethod);
    newAcctSchema.setUseAccountAlias(hasAlias);
    OBDal.getInstance().save(newAcctSchema);
    OBDal.getInstance().flush();
    return newAcctSchema;
  }

  /**
   * 
   * @param acctSchema
   * @param orgProvided
   *          optional parameter. If null, organization 0 will be used
   * @param listElement
   *          element of the reference list which is going to be inserted. From it's name, the name
   *          of the acct.schema element will be taken, and from it's value (search key) the type
   * @param sequence
   * @param isMandatory
   * @param isBalanced
   * @param defaultAccount
   * @param accountingElement
   * @return
   * @throws Exception
   */
  public static AcctSchemaElement insertAcctSchemaElement(AcctSchema acctSchema,
      Organization orgProvided, org.openbravo.model.ad.domain.List listElement, Long sequence,
      boolean isMandatory, boolean isBalanced, ElementValue defaultAccount,
      Element accountingElement) throws Exception {
    Organization trxOrganization = null;
    if (orgProvided == null) {
      if ((trxOrganization = getZeroOrg()) == null)
        return null;
    } else
      trxOrganization = orgProvided;
    final AcctSchemaElement newAcctSchemaElement = OBProvider.getInstance().get(
        AcctSchemaElement.class);
    newAcctSchemaElement.setAccountingSchema(acctSchema);
    newAcctSchemaElement.setClient(acctSchema.getClient());
    newAcctSchemaElement.setOrganization(acctSchema.getOrganization());
    newAcctSchemaElement.setSequenceNumber(sequence);
    newAcctSchemaElement.setName(listElement.getName());
    newAcctSchemaElement.setType(listElement.getSearchKey());
    newAcctSchemaElement.setMandatory(isMandatory);
    newAcctSchemaElement.setBalanced(isBalanced);
    // Default value for mandatory elements: OO and AC
    if (listElement.getSearchKey().equals("OO")) {
      newAcctSchemaElement.setTrxOrganization(trxOrganization);
    } else if (listElement.getSearchKey().equals("AC")) {
      newAcctSchemaElement.setAccountElement(defaultAccount);
      newAcctSchemaElement.setAccountingElement(accountingElement != null ? accountingElement
          : defaultAccount.getAccountingElement());
    }
    OBDal.getInstance().save(newAcctSchemaElement);
    OBDal.getInstance().flush();
    return newAcctSchemaElement;
  }

  public static AcctSchemaDefault insertAcctSchemaDefault(
      HashMap<String, ElementValue> defaultElementValues, AcctSchema acctSchema) throws Exception {
    final AcctSchemaDefault newAcctSchemaDefault = OBProvider.getInstance().get(
        AcctSchemaDefault.class);
    newAcctSchemaDefault.setClient(acctSchema.getClient());
    newAcctSchemaDefault.setOrganization(acctSchema.getOrganization());
    newAcctSchemaDefault.setAccountingSchema(acctSchema);
    Set<String> defaultAccts = defaultElementValues.keySet();
    for (Iterator<String> itDefaultAccts = defaultAccts.iterator(); itDefaultAccts.hasNext();) {
      String strDefault = itDefaultAccts.next();
      Client client = defaultElementValues.get(strDefault).getClient();
      Organization org = defaultElementValues.get(strDefault).getOrganization();
      if (strDefault.equals("W_INVENTORY_ACCT"))
        newAcctSchemaDefault.setWarehouseInventory(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("W_DIFFERENCES_ACCT"))
        newAcctSchemaDefault.setWarehouseDifferences(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("W_REVALUATION_ACCT"))
        newAcctSchemaDefault.setInventoryRevaluation(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("W_INVACTUALADJUST_ACCT"))
        newAcctSchemaDefault.setInventoryAdjustment(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_REVENUE_ACCT"))
        newAcctSchemaDefault.setProductRevenue(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_EXPENSE_ACCT"))
        newAcctSchemaDefault.setProductExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_ASSET_ACCT"))
        newAcctSchemaDefault.setFixedAsset(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_COGS_ACCT"))
        newAcctSchemaDefault.setProductCOGS(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_PURCHASEPRICEVARIANCE_ACCT"))
        newAcctSchemaDefault.setPurchasePriceVariance(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_INVOICEPRICEVARIANCE_ACCT"))
        newAcctSchemaDefault.setInvoicePriceVariance(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_TRADEDISCOUNTREC_ACCT"))
        newAcctSchemaDefault.setTradeDiscountReceived(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("P_TRADEDISCOUNTGRANT_ACCT"))
        newAcctSchemaDefault.setTradeDiscountGranted(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("C_RECEIVABLE_ACCT"))
        newAcctSchemaDefault.setCustomerReceivablesNo(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("C_PREPAYMENT_ACCT"))
        newAcctSchemaDefault.setCustomerPrepayment(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("V_LIABILITY_ACCT"))
        newAcctSchemaDefault.setVendorLiability(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("V_LIABILITY_SERVICES_ACCT"))
        newAcctSchemaDefault.setVendorServiceLiability(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("V_PREPAYMENT_ACCT"))
        newAcctSchemaDefault.setVendorPrepayment(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("PAYDISCOUNT_EXP_ACCT"))
        newAcctSchemaDefault.setPaymentDiscountExpense(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("PAYDISCOUNT_REV_ACCT"))
        newAcctSchemaDefault.setPaymentDiscountRevenue(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("WRITEOFF_ACCT"))
        newAcctSchemaDefault.setWriteoff(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("UNREALIZEDGAIN_ACCT"))
        newAcctSchemaDefault.setUnrealizedGainsAcct(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("UNREALIZEDLOSS_ACCT"))
        newAcctSchemaDefault.setUnrealizedLossesAcct(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("REALIZEDGAIN_ACCT"))
        newAcctSchemaDefault.setRealizedGainAcct(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("REALIZEDLOSS_ACCT"))
        newAcctSchemaDefault.setRealizedLossAcct(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("WITHHOLDING_ACCT"))
        newAcctSchemaDefault.setWithholdingAccount(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("E_PREPAYMENT_ACCT"))
        newAcctSchemaDefault.setEmployeePrepayments(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("E_EXPENSE_ACCT"))
        newAcctSchemaDefault.setEmployeeExpenses(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("PJ_ASSET_ACCT"))
        newAcctSchemaDefault.setProjectAsset(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("PJ_WIP_ACCT"))
        newAcctSchemaDefault.setWorkInProgress(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("T_EXPENSE_ACCT"))
        newAcctSchemaDefault.setTaxExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("T_LIABILITY_ACCT"))
        newAcctSchemaDefault.setTaxLiability(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("T_RECEIVABLES_ACCT"))
        newAcctSchemaDefault.setTaxReceivables(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("T_DUE_ACCT"))
        newAcctSchemaDefault.setTaxDue(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("T_CREDIT_ACCT"))
        newAcctSchemaDefault.setTaxCredit(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_INTRANSIT_ACCT"))
        newAcctSchemaDefault.setBankInTransit(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_ASSET_ACCT"))
        newAcctSchemaDefault.setBankAsset(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_EXPENSE_ACCT"))
        newAcctSchemaDefault.setBankExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_INTERESTREV_ACCT"))
        newAcctSchemaDefault.setBankInterestRevenue(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_INTERESTEXP_ACCT"))
        newAcctSchemaDefault.setBankInterestExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_UNIDENTIFIED_ACCT"))
        newAcctSchemaDefault.setBankUnidentifiedReceipts(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("B_SETTLEMENTGAIN_ACCT"))
        newAcctSchemaDefault.setBankSettlementGain(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_SETTLEMENTLOSS_ACCT"))
        newAcctSchemaDefault.setBankSettlementLoss(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_REVALUATIONGAIN_ACCT"))
        newAcctSchemaDefault.setBankRevaluationGain(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_REVALUATIONLOSS_ACCT"))
        newAcctSchemaDefault.setBankRevaluationLoss(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_PAYMENTSELECT_ACCT"))
        newAcctSchemaDefault.setPaymentSelection(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("B_UNALLOCATEDCASH_ACCT"))
        newAcctSchemaDefault.setUnallocatedCash(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CH_EXPENSE_ACCT"))
        newAcctSchemaDefault.setChargeExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CH_REVENUE_ACCT"))
        newAcctSchemaDefault.setChargeRevenue(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("UNEARNEDREVENUE_ACCT"))
        newAcctSchemaDefault.setUnearnedRevenue(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("NOTINVOICEDRECEIVABLES_ACCT"))
        newAcctSchemaDefault.setNonInvoicedReceivables(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("NOTINVOICEDREVENUE_ACCT"))
        newAcctSchemaDefault.setNonInvoicedRevenues(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("NOTINVOICEDRECEIPTS_ACCT"))
        newAcctSchemaDefault.setNonInvoicedReceipts(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CB_ASSET_ACCT"))
        newAcctSchemaDefault.setCashBookAsset(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CB_CASHTRANSFER_ACCT"))
        newAcctSchemaDefault.setCashTransfer(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CB_DIFFERENCES_ACCT"))
        newAcctSchemaDefault.setCashBookDifferences(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("CB_RECEIPT_ACCT"))
        newAcctSchemaDefault.setCashBookReceipt(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("A_DEPRECIATION_ACCT"))
        newAcctSchemaDefault.setDepreciation(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));

      if (strDefault.equals("A_ACCUMDEPRECIATION_ACCT"))
        newAcctSchemaDefault.setAccumulatedDepreciation(getAcctComb(client, org,
            defaultElementValues.get(strDefault), acctSchema, true));

      if (strDefault.equals("A_DISPOSAL_LOSS"))
        newAcctSchemaDefault.setDisposalLoss(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("A_DISPOSAL_GAIN"))
        newAcctSchemaDefault.setDisposalGain(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("CB_EXPENSE_ACCT"))
        newAcctSchemaDefault.setCashBookExpense(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
    }

    OBDal.getInstance().save(newAcctSchemaDefault);
    OBDal.getInstance().flush();
    return newAcctSchemaDefault;
  }

  public static AcctSchemaGL insertAcctSchemaGL(HashMap<String, ElementValue> defaultElementValues,
      AcctSchema acctSchema) throws Exception {
    final AcctSchemaGL newAcctSchemaGL = OBProvider.getInstance().get(AcctSchemaGL.class);
    newAcctSchemaGL.setClient(acctSchema.getClient());
    newAcctSchemaGL.setOrganization(acctSchema.getOrganization());
    newAcctSchemaGL.setAccountingSchema(acctSchema);

    Set<String> defaultAccts = defaultElementValues.keySet();
    for (Iterator<String> itDefaultAccts = defaultAccts.iterator(); itDefaultAccts.hasNext();) {
      String strDefault = itDefaultAccts.next();
      Client client = defaultElementValues.get(strDefault).getClient();
      Organization org = defaultElementValues.get(strDefault).getOrganization();
      if (strDefault.equals("CURRENCYBALANCING_ACCT")) {
        newAcctSchemaGL.setCurrencyBalancingAcct(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
        newAcctSchemaGL.setCurrencyBalancingUse(true);
      }
      if (strDefault.equals("INTERCOMPANYDUEFROM_ACCT"))
        newAcctSchemaGL.setDueFromIntercompany(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("INTERCOMPANYDUETO_ACCT"))
        newAcctSchemaGL.setDueToIntercompany(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("INCOMESUMMARY_ACCT"))
        newAcctSchemaGL.setIncomeSummary(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("PPVOFFSET_ACCT"))
        newAcctSchemaGL.setPPVOffset(getAcctComb(client, org, defaultElementValues.get(strDefault),
            acctSchema, true));
      if (strDefault.equals("RETAINEDEARNING_ACCT"))
        newAcctSchemaGL.setRetainedEarning(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
      if (strDefault.equals("SUSPENSEBALANCING_ACCT")) {
        newAcctSchemaGL.setSuspenseBalancing(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
        newAcctSchemaGL.setSuspenseBalancingUse(true);
      }
      if (strDefault.equals("SUSPENSEERROR_ACCT"))
        newAcctSchemaGL.setSuspenseError(getAcctComb(client, org, defaultElementValues
            .get(strDefault), acctSchema, true));
    }

    OBDal.getInstance().save(newAcctSchemaGL);
    OBDal.getInstance().flush();
    return newAcctSchemaGL;
  }

  private static AccountingCombination getAcctComb(Client client, Organization orgProvided,
      ElementValue elementValue, AcctSchema acctSchema, Boolean isFullyQualified) {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;

    final AccountingCombination newAcctComb = OBProvider.getInstance().get(
        AccountingCombination.class);

    newAcctComb.setClient(client);
    newAcctComb.setOrganization(organization);
    newAcctComb.setAccount(elementValue);
    newAcctComb.setAccountingSchema(acctSchema);
    newAcctComb.setOrganization(elementValue.getOrganization());
    newAcctComb.setFullyQualified(isFullyQualified);

    OBDal.getInstance().save(newAcctComb);
    OBDal.getInstance().flush();
    return newAcctComb;
  }

  public static OrganizationAcctSchema insertOrgAcctSchema(Client client, AcctSchema acctSchema,
      Organization orgProvided) {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    final OrganizationAcctSchema newOrganizationAcctSchema = OBProvider.getInstance().get(
        OrganizationAcctSchema.class);
    newOrganizationAcctSchema.setClient(client);
    newOrganizationAcctSchema.setOrganization(organization);
    newOrganizationAcctSchema.setAccountingSchema(acctSchema);
    OBDal.getInstance().save(newOrganizationAcctSchema);
    OBDal.getInstance().flush();
    return newOrganizationAcctSchema;
  }

  public static GLCategory insertCategory(Client client, Organization organization, String name,
      String categoryType, boolean isDefault) {
    final GLCategory newGLCategory = OBProvider.getInstance().get(GLCategory.class);
    newGLCategory.setClient(client);
    newGLCategory.setOrganization(organization);
    newGLCategory.setName(name);
    newGLCategory.setCategoryType(categoryType);
    newGLCategory.setDefault(isDefault);
    OBDal.getInstance().save(newGLCategory);
    OBDal.getInstance().flush();
    return newGLCategory;
  }

  public static Sequence insertSequence(Client client, Organization organization, String name,
      Long startNo) {
    final Sequence newSequence = OBProvider.getInstance().get(Sequence.class);
    newSequence.setClient(client);
    newSequence.setOrganization(organization);
    newSequence.setName(name);
    newSequence.setStartingNo(startNo);
    OBDal.getInstance().save(newSequence);
    OBDal.getInstance().flush();
    return newSequence;
  }

  public static DocumentType insertDocType(Client client, Organization organization, String name,
      String printName, String docBaseType, String docSubTypeSO, DocumentType shipment,
      DocumentType invoice, boolean isDocNoControlled, Sequence sequence, GLCategory category,
      boolean isSOTrx, Table table) {
    final DocumentType newDocumentType = OBProvider.getInstance().get(DocumentType.class);
    newDocumentType.setClient(client);
    newDocumentType.setOrganization(organization);
    newDocumentType.setName(name);
    newDocumentType.setPrintText(printName);
    newDocumentType.setDocumentCategory(docBaseType);
    newDocumentType.setSOSubType(docSubTypeSO);
    newDocumentType.setDocumentTypeForShipment(shipment);
    newDocumentType.setDocumentTypeForInvoice(invoice);
    newDocumentType.setSequencedDocument(isDocNoControlled);
    newDocumentType.setDocumentSequence(sequence);
    newDocumentType.setGLCategory(category);
    newDocumentType.setSalesTransaction(isSOTrx);
    newDocumentType.setTable(table);
    OBDal.getInstance().save(newDocumentType);
    OBDal.getInstance().flush();
    return newDocumentType;
  }

  public static ImportResult insertReferenceData(DataSet dataset, Client client,
      Organization orgProvided) throws Exception {
    Organization organization = null;
    if (orgProvided == null) {
      if ((organization = getZeroOrg()) == null)
        return null;
    } else
      organization = orgProvided;
    ImportResult myResult = null;
    String strSourcePath = OBPropertiesProvider.getInstance().getOpenbravoProperties().getProperty(
        "source.path");
    String strPath = "";
    if (dataset.getModule().getJavaPackage().equals("org.openbravo")) {
      strPath = strSourcePath + "/referencedata/standard";
    } else {
      strPath = strSourcePath + "/modules/" + dataset.getModule().getJavaPackage()
          + "/referencedata/standard";
    }
    File datasetFile = new File(strPath + "/" + Utility.wikifiedName(dataset.getName()) + ".xml");
    if (!datasetFile.exists()) {
      // TODO: Throw exception file not exist
      return myResult;
    }
    DataImportService myData = DataImportService.getInstance();
    String strXml = Utility.fileToString(datasetFile.getPath());
    myResult = myData.importDataFromXML(client, organization, strXml, dataset.getModule());

    insertClientModule(client, dataset.getModule());

    return myResult;
  }

  // public static boolean existsADClientModule(Client client, DataSet dataset) {
  // String whereClause = " as cm where cm." + ADClientModule.PROPERTY_CLIENT + "=:client and cm."
  // + ADClientModule.PROPERTY_MODULE + "=:module and cm." + ADClientModule.PROPERTY_VERSION
  // + "=:version";
  //
  // final OBQuery<ADClientModule> obqParameters = OBDal.getInstance().createQuery(
  // ADClientModule.class, whereClause);
  // obqParameters.setNamedParameter("client", client);
  // obqParameters.setNamedParameter("module", dataset.getModule());
  // obqParameters.setNamedParameter("version", dataset.getModule().getVersion());
  // return (0 < obqParameters.list().size());
  // }
  //
  // public static ADClientModule insertADClientModule(Client client, DataSet dataset) {
  // final ADClientModule newADClientModule = OBProvider.getInstance().get(ADClientModule.class);
  // newADClientModule.setClient(client);
  // newADClientModule.setModule(dataset.getModule());
  // newADClientModule.setVersion(dataset.getModule().getVersion());
  // OBDal.getInstance().save(newADClientModule);
  // OBDal.getInstance().flush();
  // return newADClientModule;
  // }

  public static DocumentTemplate insertDoctypeTemplate(DocumentType document, String name,
      String templateLocation, String templateFileName, String reportFileName) {
    final DocumentTemplate newDocumentTemplate = OBProvider.getInstance().get(
        DocumentTemplate.class);
    newDocumentTemplate.setClient(document.getClient());
    newDocumentTemplate.setOrganization(document.getOrganization());
    newDocumentTemplate.setName(name);
    newDocumentTemplate.setDocumentType(document);
    newDocumentTemplate.setTemplateLocation(templateLocation);
    newDocumentTemplate.setTemplateFilename(templateFileName);
    newDocumentTemplate.setReportFilename(reportFileName);
    OBDal.getInstance().save(newDocumentTemplate);
    OBDal.getInstance().flush();
    return newDocumentTemplate;
  }

  public static EmailTemplate insertEmailTemplate(DocumentTemplate documentTemplate) {
    final EmailTemplate newEmailTemplate = OBProvider.getInstance().get(EmailTemplate.class);
    newEmailTemplate.setClient(documentTemplate.getClient());
    newEmailTemplate.setPocDocumentType(documentTemplate);
    OBDal.getInstance().save(newEmailTemplate);
    OBDal.getInstance().flush();
    return newEmailTemplate;
  }

  public static List<Module> getCOAModules(String strModules) throws Exception {
    StringBuilder strWhereClause = new StringBuilder();
    strWhereClause.append(" as module where module.id in (" + strModules + ")");
    strWhereClause.append(" and module.hasChartOfAccounts = 'Y'");
    final OBQuery<Module> obqModule = OBDal.getInstance().createQuery(Module.class,
        strWhereClause.toString());
    return obqModule.list();
  }

  public static List<Module> getRDModules(String strModules) throws Exception {
    StringBuilder strWhereClause = new StringBuilder();
    strWhereClause.append(" as module where module.id in (" + strModules + ")");
    strWhereClause.append(" and module.hasReferenceData = 'Y'");
    strWhereClause.append(" and module.hasChartOfAccounts = 'N'");
    final OBQuery<Module> obqModule = OBDal.getInstance().createQuery(Module.class,
        strWhereClause.toString());
    return obqModule.list();
  }

  public static List<DataSet> getDataSets(Module module) throws Exception {

    final OBCriteria<DataSet> obcDataSets = OBDal.getInstance().createCriteria(DataSet.class);
    obcDataSets.add(Expression.eq(DataSet.PROPERTY_MODULE, module));
    ArrayList<String> coAccessLevel = new ArrayList<String>();
    // coAccessLevel.add("1"); // Organization
    // TODO: through parameter, add organization only as well.
    coAccessLevel.add("3"); // Client/Organization
    obcDataSets.add(Expression.in(DataSet.PROPERTY_DATAACCESSLEVEL, coAccessLevel));
    if (obcDataSets.list().size() > 0)
      return obcDataSets.list();
    else
      return null;

  }

  public static List<org.openbravo.model.ad.domain.List> getAcctSchemaElements() throws Exception {

    final OBCriteria<org.openbravo.model.ad.domain.List> obcRefList = OBDal.getInstance()
        .createCriteria(org.openbravo.model.ad.domain.List.class);
    obcRefList.add(Expression.eq(org.openbravo.model.ad.domain.List.PROPERTY_REFERENCE, OBDal
        .getInstance().get(Reference.class, "181")));
    if (obcRefList.list().size() > 0)
      return obcRefList.list();
    else
      return null;

  }

  public static ADClientModule insertClientModule(Client client, Module module) throws Exception {
    final ADClientModule newADClientModule = OBProvider.getInstance().get(ADClientModule.class);
    newADClientModule.setClient(client);
    newADClientModule.setOrganization(getZeroOrg());
    newADClientModule.setModule(module);
    newADClientModule.setVersion(module.getVersion());

    OBDal.getInstance().save(newADClientModule);
    OBDal.getInstance().flush();
    return newADClientModule;
  }
}
