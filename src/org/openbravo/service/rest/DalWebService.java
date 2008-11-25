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
 * The Initial Developer of the Original Code is Openbravo SL 
 * All portions are Copyright (C) 2008 Openbravo SL 
 * All Rights Reserved. 
 * Contributor(s):  ______________________________________.
 ************************************************************************
 */

package org.openbravo.service.rest;

import java.io.Writer;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.dom4j.Document;
import org.dom4j.io.SAXReader;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.base.structure.ClientEnabled;
import org.openbravo.base.structure.OrganizationEnabled;
import org.openbravo.base.util.Check;
import org.openbravo.base.util.CheckException;
import org.openbravo.dal.core.OBContext;
import org.openbravo.dal.service.OBDal;
import org.openbravo.dal.service.OBQuery;
import org.openbravo.dal.xml.EntityXMLConverter;
import org.openbravo.dal.xml.ModelXMLConverter;
import org.openbravo.dal.xml.XMLEntityConverter;
import org.openbravo.dal.xml.XMLUtil;
import org.openbravo.dal.xml.EntityResolver.ResolvingMode;
import org.openbravo.model.ad.datamodel.Table;
import org.openbravo.model.ad.utility.ReferenceDataStore;
import org.openbravo.service.web.InvalidContentException;
import org.openbravo.service.web.ResourceNotFoundException;
import org.openbravo.service.web.WebService;
import org.openbravo.service.web.WebServiceUtil;

/**
 * The main dal rest web service implementation.
 * 
 * @author mtaal
 */

public class DalWebService implements WebService {

    private static final long serialVersionUID = 1L;

    public void doGet(String path, HttpServletRequest request,
            HttpServletResponse response) throws Exception {
        final String segment = WebServiceUtil.getInstance().getFirstSegment(
                path);
        final String[] segments = WebServiceUtil.getInstance()
                .getSegments(path);

        Document doc;
        if (segment == null || segment.length() == 0) {
            doc = ModelXMLConverter.getInstance().getTypesAsXML();
        } else if (segment.equals("schema")) {
            doc = ModelXMLConverter.getInstance().getSchema();
        } else {
            final String entityName = segment;

            try {
                ModelProvider.getInstance().getEntity(entityName);
            } catch (final CheckException ce) {
                throw new ResourceNotFoundException("Resource " + entityName
                        + " not found", ce);
            }

            // now check the second segment and see if an operation is required
            String id = null;
            boolean countOperation = false;
            if (segments.length == 2) {
                if (segments[1].equals("count")) {
                    countOperation = true;
                } else {
                    id = segments[1];
                }
            }

            if (id == null) {
                // show all of type entityname

                // check if there is a whereClause
                final String where = request.getParameter("where");
                final String orderBy = request.getParameter("orderBy");

                String whereOrderByClause = "";
                if (where != null) {
                    whereOrderByClause += where;
                }
                if (orderBy != null && !countOperation) {
                    whereOrderByClause += " order by " + orderBy;
                }

                final OBQuery<BaseOBObject> obq = OBDal.getInstance()
                        .createQuery(entityName, whereOrderByClause);
                if (countOperation) {
                    response.setContentType("text/xml");
                    response.setCharacterEncoding("utf-8");
                    final String xml = WebServiceUtil.getInstance()
                            .createResultXML("" + obq.count());
                    final Writer w = response.getWriter();
                    w.write(xml);
                    w.close();
                    return;
                } else {
                    final EntityXMLConverter exc = EntityXMLConverter
                            .newInstance();
                    exc.setOptionEmbedChildren(true);
                    exc.setOptionIncludeChildren(true);
                    exc.setOptionIncludeReferenced(false);
                    exc.setOptionExportClientOrganizationReferences(true);
                    exc.process(obq.list());
                    doc = exc.getDocument();
                }
            } else {
                final BaseOBObject result = OBDal.getInstance().get(entityName,
                        id);
                if (result == null) {
                    throw new ResourceNotFoundException(
                            "No resource found for entity " + entityName
                                    + " using id " + id);
                }
                final EntityXMLConverter exc = EntityXMLConverter.newInstance();
                exc.setOptionEmbedChildren(true);
                exc.setOptionIncludeChildren(true);
                exc.setOptionIncludeReferenced(false);
                exc.setOptionExportClientOrganizationReferences(true);
                exc.process(result);
                doc = exc.getDocument();
            }
        }
        if (request.getParameter("template") != null) {
            final Document newDoc = WebServiceUtil.getInstance().applyTemplate(
                    doc,
                    this.getClass().getResourceAsStream(
                            request.getParameter("template")));
            response.setContentType("text/html");
            response.setCharacterEncoding("utf-8");
            final String xml = XMLUtil.getInstance().toString(newDoc);
            final Writer w = response.getWriter();
            w.write(xml);
            w.close();
        }
        response.setContentType("text/xml");
        response.setCharacterEncoding("utf-8");
        final String xml = XMLUtil.getInstance().toString(doc);
        final Writer w = response.getWriter();
        w.write(xml);
        w.close();
    }

    public void doPost(String path, HttpServletRequest request,
            HttpServletResponse response) {
        doChangeAction(path, request, response, ChangeAction.CREATE);
    }

    public void doDelete(String path, HttpServletRequest request,
            HttpServletResponse response) {

        // check if the url points to a specific business object, if so remove
        // it!
        final String[] segments = WebServiceUtil.getInstance()
                .getSegments(path);
        if (segments.length == 2) {
            final String entityName = segments[0];
            final String id = segments[1];
            final BaseOBObject result = OBDal.getInstance().get(entityName, id);
            final String resIdentifier = result.getIdentifier();
            OBDal.getInstance().remove(result);

            final String resultXml = WebServiceUtil.getInstance()
                    .createResultXMLWithLogWarning(
                            "Action performed successfully",
                            "Removed business object " + resIdentifier, null);
            try {
                final Writer w = response.getWriter();
                w.write(resultXml);
                w.close();
            } catch (final Exception e) {
                throw new OBException(e);
            }
            return;
        }

        // use the content of the request
        doChangeAction(path, request, response, ChangeAction.DELETE);
    }

    public void doPut(String path, HttpServletRequest request,
            HttpServletResponse response) {
        // update a resource
        doChangeAction(path, request, response, ChangeAction.UPDATE);
    }

    public void doChangeAction(String path, HttpServletRequest request,
            HttpServletResponse response, ChangeAction changeAction) {
        response.setContentType("text/xml");
        response.setCharacterEncoding("utf-8");
        final String resultXml = doChangeActionXML(path, request, response,
                changeAction);
        try {
            final Writer w = response.getWriter();
            w.write(resultXml);
            w.close();
        } catch (final Exception e) {
            throw new OBException(e);
        }
        return;
    }

    public String doChangeActionXML(String path, HttpServletRequest request,
            HttpServletResponse response, ChangeAction changeAction) {
        // get the resource
        final String segment = WebServiceUtil.getInstance().getFirstSegment(
                path);
        try {
            ModelProvider.getInstance().getEntity(segment);
        } catch (final CheckException ce) {
            throw new ResourceNotFoundException("Resource " + segment
                    + " not found", ce);
        }

        try {
            final SAXReader reader = new SAXReader();
            final Document document = reader.read(request.getInputStream());

            // now parse the xml and let it be translated to a set of
            // of objects, note that referenced objects are supposed to be
            // present and are not inserted/updated.
            return importDataFromXML(document, changeAction);

        } catch (final Exception e) {
            throw new OBException(e);
        }
    }

    public String importDataFromXML(Document doc, ChangeAction changeAction) {

        final XMLEntityConverter xec = XMLEntityConverter.newInstance();
        xec.setClient(OBContext.getOBContext().getCurrentClient());
        xec.setOrganization(OBContext.getOBContext().getCurrentOrganisation());

        // for a webservice referenced entities should not be created at all!
        xec.getEntityResolver().setOptionCreateReferencedIfNotFound(false);

        // the create action also supports updating
        // an update action should only update
        // and a delete action should be lenient, allowing non existing
        // entities
        // so only update does not allow non-existing entities
        if (changeAction == ChangeAction.UPDATE) {
            xec.getEntityResolver().setResolvingMode(ResolvingMode.MUSTEXIST);
        }
        final List<BaseOBObject> processedObjects = xec.process(doc);

        if (xec.getErrorMessages() != null) {
            throw new InvalidContentException(xec.getErrorMessages());
        }

        // the create action also allows updating
        if (changeAction == ChangeAction.CREATE
                || changeAction == ChangeAction.UPDATE) {
            return doCreateUpdate(xec);
        } else if (changeAction == ChangeAction.DELETE) {
            return doDeleteAction(xec, processedObjects);
        } else {
            throw new OBException("Unsupported change action " + changeAction);
        }
    }

    protected String doDeleteAction(XMLEntityConverter xec,
            List<BaseOBObject> processedObjects) {
        final StringBuilder sb = new StringBuilder();
        int deleted = 0;
        int notDeleted = 0;
        final List<BaseOBObject> deletedList = new ArrayList<BaseOBObject>();
        for (final BaseOBObject bob : processedObjects) {
            final String originalId = xec.getEntityResolver()
                    .getOriginalId(bob);
            if (!bob.isNewOBObject()) {
                OBDal.getInstance().remove(bob);
                if (sb.length() > 0) {
                    sb.append("\n");
                }
                sb.append("Removed business object " + bob.getIdentifier());
                if (originalId != null) {
                    sb.append(", import id: " + originalId);
                }
                deletedList.add(bob);
                deleted++;
            } else {
                sb.append("Not removed business object " + bob.getIdentifier()
                        + " because it could not be found");
                if (originalId != null) {
                    sb.append(", import id: " + originalId);
                }
                notDeleted++;
            }
        }
        if (sb.length() > 0) {
            sb.append("\n");
        }
        sb.append("Removed " + deleted + " business objects, " + notDeleted
                + " business objects could not be found, so not removed");
        return WebServiceUtil.getInstance()
                .createResultXMLWithObjectsAndWarning(
                        "Action performed successfully", sb.toString(), null,
                        null, null, deletedList);
    }

    protected String doCreateUpdate(XMLEntityConverter xec) {
        // now save and update
        // do inserts and updates in opposite order, this is important
        // so that the objects on which other depend are inserted first
        final List<BaseOBObject> toInsert = xec.getToInsert();
        int done = 0;
        for (int i = toInsert.size() - 1; i > -1; i--) {
            final BaseOBObject ins = toInsert.get(i);
            OBDal.getInstance().save(ins);
            done++;
        }
        Check.isTrue(done == toInsert.size(),
                "Not all objects have been inserted, check for loop: " + done
                        + "/" + toInsert.size());

        // flush to set the ids in the objects
        OBDal.getInstance().flush();

        // do the updates the other way around also
        done = 0;
        final List<BaseOBObject> toUpdate = xec.getToUpdate();
        for (int i = toUpdate.size() - 1; i > -1; i--) {
            final BaseOBObject upd = toUpdate.get(i);
            OBDal.getInstance().save(upd);
            done++;
        }
        Check.isTrue(done == toUpdate.size(),
                "Not all objects have been inserted, check for loop: " + done
                        + "/" + toUpdate.size());

        // flush to set the ids in the objects
        OBDal.getInstance().flush();

        // store the ad_ref_data_loaded
        try {
            OBContext.getOBContext().setInAdministratorMode(true);
            for (final BaseOBObject ins : xec.getToInsert()) {
                final String originalId = xec.getEntityResolver()
                        .getOriginalId(ins);
                // completely new object, manually added to the xml
                if (originalId == null) {
                    continue;
                }
                final ReferenceDataStore rdl = OBProvider.getInstance().get(
                        ReferenceDataStore.class);
                if (ins instanceof ClientEnabled) {
                    rdl.setClient(((ClientEnabled) ins).getClient());
                }
                if (ins instanceof OrganizationEnabled) {
                    rdl.setOrganization(((OrganizationEnabled) ins)
                            .getOrganization());
                }
                rdl.setGeneric(originalId);
                rdl.setSpecific((String) ins.getId());
                rdl.setTable(OBDal.getInstance().get(Table.class,
                        ins.getEntity().getTableId()));
                OBDal.getInstance().save(rdl);
            }
        } finally {
            OBContext.getOBContext().restorePreviousAdminMode();
        }
        final String log = (xec.getLogMessages() != null ? xec.getLogMessages()
                : "")
                + (xec.getLogMessages() != null ? "\n" : "")
                + "Updated "
                + xec.getToUpdate().size()
                + " business objects, Inserted "
                + xec.getToInsert().size() + " business objects ";

        return WebServiceUtil.getInstance()
                .createResultXMLWithObjectsAndWarning(
                        "Action performed successfully", log,
                        xec.getWarningMessages(), xec.getToInsert(),
                        xec.getToUpdate(), null);
    }
}