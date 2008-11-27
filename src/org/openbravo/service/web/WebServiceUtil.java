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

package org.openbravo.service.web;

import java.io.InputStream;
import java.util.List;

import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.stream.StreamSource;

import org.dom4j.Document;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import org.dom4j.io.DocumentResult;
import org.dom4j.io.DocumentSource;
import org.openbravo.base.exception.OBException;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.provider.OBSingleton;
import org.openbravo.base.structure.BaseOBObject;
import org.openbravo.dal.xml.XMLUtil;

/**
 * Utility class for webservices, contains convenience methods for creating
 * result xml messages.
 * 
 * @author mtaal
 */

public class WebServiceUtil implements OBSingleton {

    private static WebServiceUtil instance = new WebServiceUtil();

    public static WebServiceUtil getInstance() {
        if (instance == null) {
            instance = OBProvider.getInstance().get(WebServiceUtil.class);
        }
        return instance;
    }

    public static void setInstance(WebServiceUtil instance) {
        WebServiceUtil.instance = instance;
    }

    /**
     * Creates an error xml result String using the information from the passed
     * in Throwable.
     * 
     * @param t
     *            the Throwable used to set the error message
     * @return the xml error String, e.g. <error><message>An error
     *         occurred</message></error>
     */
    public String createErrorXML(Throwable t) {
        Throwable x = t;
        final StringBuilder sb = new StringBuilder(t.getMessage());

        // prevent infinite cycling
        while (x.getCause() != null && x.getCause() != t) {
            x = x.getCause();
            sb.append("\nCaused by: " + x.getMessage());
        }

        return "<error><message>" + sb + "</message></error>";
    }

    /**
     * Creates a standard result xml: <result>My Result</result>
     * 
     * @param content
     *            the content of the result message
     * @return a xml result string
     */
    public String createResultXML(String content) {
        return "<result>" + content + "</result>";
    }

    /**
     * Creates a standard result xml with log and warning: <result><msg>My
     * Result</msg><log>My Log</log><warning>My Warning</warning></result>
     * 
     * @param msg
     *            the content of the result
     * @param log
     *            the log message
     * @param warning
     *            the warning message
     * @return a xml result string
     */
    public String createResultXMLWithLogWarning(String msg, String log,
            String warning) {
        final Document doc = DocumentHelper.createDocument();
        final Element rootElement = doc.addElement("result");
        if (msg != null && msg.trim().length() > 0) {
            rootElement.addElement("msg").addText(msg);
        }
        if (log != null && log.trim().length() > 0) {
            rootElement.addElement("log").addText(log);
        }
        if (warning != null && warning.trim().length() > 0) {
            rootElement.addElement("warning").addText(warning);
        }
        return XMLUtil.getInstance().toString(doc);
    }

    /**
     * Creates a full result xml with message, log, warning and the id and
     * identifiers of the inserted, updated and deleted objects. Especially id's
     * are required because the caller of the webservice (which inserts objects)
     * needs to be able to retrieve the id's of the inserted objects to retrieve
     * these objects later again.
     * 
     * @return the xml message containing the message, log, warning and id and
     *         identifiers of inserted, updated and deleted messages
     */
    public String createResultXMLWithObjectsAndWarning(String msg, String log,
            String warning, List<BaseOBObject> inserted,
            List<BaseOBObject> updated, List<BaseOBObject> deleted) {
        final Document doc = DocumentHelper.createDocument();
        final Element rootElement = doc.addElement("result");
        if (msg != null && msg.trim().length() > 0) {
            rootElement.addElement("msg").addText(msg);
        }
        if (log != null && log.trim().length() > 0) {
            rootElement.addElement("log").addText(log);
        }
        if (warning != null && warning.trim().length() > 0) {
            rootElement.addElement("warning").addText(warning);
        }
        addGroupElement(rootElement, inserted, "inserted");
        addGroupElement(rootElement, updated, "updated");
        addGroupElement(rootElement, deleted, "deleted");
        return XMLUtil.getInstance().toString(doc);
    }

    private void addGroupElement(Element parentElement,
            List<BaseOBObject> bobs, String elementName) {
        if (bobs == null || bobs.size() == 0) {
            return;
        }
        final Element groupElement = parentElement.addElement(elementName);
        for (final BaseOBObject bob : bobs) {
            final Element bobElement = groupElement.addElement(bob
                    .getEntityName());
            bobElement.addAttribute("id", (String) bob.getId());
            bobElement.addAttribute("identifier", bob.getIdentifier());

        }
    }

    /**
     * Returns the first segment of a path, for example: /openbravo/webservice
     * will return openbravo here. This method is used to find the name of the
     * webservice which is requested.
     * 
     * @param path
     *            the request.getPath()
     * @return the first part of the path
     */
    public String getFirstSegment(String path) {
        String localPath = path;
        if (path.startsWith("/")) {
            localPath = localPath.substring(1);
        }
        if (localPath.endsWith("/")) {
            localPath = localPath.substring(0, localPath.length() - 1);
        }
        if (localPath.indexOf("/") != -1) {
            localPath = localPath.substring(0, localPath.indexOf("/"));
        }

        return localPath;
    }

    /**
     * Splits the path into segments by splitting on the / character
     * 
     * @param path
     *            the request.getPath()
     * @return the segments of the path
     */
    public String[] getSegments(String path) {
        String localPath = path;
        if (path.startsWith("/")) {
            localPath = localPath.substring(1);
        }
        if (path.endsWith("/")) {
            localPath = localPath.substring(0, path.length() - 1);
        }
        return localPath.split("/");
    }

    /**
     * Applies an XSLT template on the XML in the sourceDocument. The resulting
     * Dom4j Document is returned.
     * 
     * @param sourceDocument
     *            the source xml
     * @param template
     *            the XSLT template
     * @return the resulting XML
     */
    public Document applyTemplate(Document sourceDocument, InputStream template) {
        try {
            final TransformerFactory factory = TransformerFactory.newInstance();
            final Transformer transformer = factory
                    .newTransformer(new StreamSource(template));
            final DocumentSource source = new DocumentSource(sourceDocument);
            final DocumentResult result = new DocumentResult();
            transformer.transform(source, result);

            return result.getDocument();
        } catch (final Exception e) {
            throw new OBException(e);
        }
    }
}