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

package org.openbravo.erpCommon.utility;

import org.openbravo.base.secureApp.HttpSecureAppServlet;
import org.openbravo.base.secureApp.VariablesSecureApp;

import java.io.*;

import javax.servlet.*;
import javax.servlet.http.*;

/**
 * This servlet manages the ajax requests generated by any of the GenericTree
 * subclasses
 * 
 * It is able to manage the following commands: -OPENNODE : Opens the subtree
 * for the node, and returns its subtree. -DESCRIPTION : Returns the description
 * for a node. -DESCRIPTION2: Returns an alternative description (e.g. Update
 * description for Modules)
 * 
 */
public class GenericTreeServlet extends HttpSecureAppServlet {
    private static final long serialVersionUID = 1L;

    public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws IOException, ServletException {
        VariablesSecureApp vars = new VariablesSecureApp(request);
        if (vars.commandIn("OPENNODE")) {
            String strNode = vars.getRequiredStringParameter("inpNodeId");
            String treeClass = vars.getRequiredStringParameter("inpTreeClass");
            String level = vars.getRequiredStringParameter("inpLevel");

            printOpenNode(response, vars, strNode, treeClass, level);
        }
        if (vars.commandIn("DESCRIPTION")) {
            String strNode = vars.getRequiredStringParameter("inpNodeId");
            String treeClass = vars.getRequiredStringParameter("inpTreeClass");
            printDescription(response, vars, strNode, treeClass, 1);
        }
        if (vars.commandIn("DESCRIPTION2")) {
            String strNode = vars.getRequiredStringParameter("inpNodeId");
            String treeClass = vars.getRequiredStringParameter("inpTreeClass");
            printDescription(response, vars, strNode, treeClass, 2);
        }

        else
            pageError(response);
    }

    /**
     * Returns a subtree for the node.
     * 
     * @param response
     * @param vars
     * @param strNodeId
     * @param treeClass
     * @throws IOException
     * @throws ServletException
     */
    void printOpenNode(HttpServletResponse response, VariablesSecureApp vars,
            String strNodeId, String treeClass, String level)
            throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: ajaxreponse");

        response.setContentType("text/plain; charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        PrintWriter out = response.getWriter();
        String htmlTree = "";
        try {
            String newLevel = new Integer(new Integer(level).intValue() + 1)
                    .toString();
            GenericTree tree = (GenericTree) Class.forName(treeClass)
                    .newInstance();
            tree.setParameters(this);
            tree.setLanguage(vars.getLanguage());
            tree.setSubTree(strNodeId, newLevel);
            htmlTree = tree.toHtml();
        } catch (Exception e) {
            e.printStackTrace();
        }
        out.println(htmlTree);
        out.close();
    }

    /**
     * Returns a HTML description for a node.
     * 
     * @param response
     * @param vars
     * @param strNodeId
     * @param treeClass
     * @param type
     * @throws IOException
     * @throws ServletException
     */
    void printDescription(HttpServletResponse response,
            VariablesSecureApp vars, String strNodeId, String treeClass,
            int type) throws IOException, ServletException {
        if (log4j.isDebugEnabled())
            log4j.debug("Output: ajaxreponse");

        String description = "";
        response.setContentType("text/plain; charset=UTF-8");
        response.setHeader("Cache-Control", "no-cache");
        PrintWriter out = response.getWriter();

        try {
            GenericTree tree = (GenericTree) Class.forName(treeClass)
                    .newInstance();
            tree.setParameters(this);
            tree.setLanguage(vars.getLanguage());
            description = tree.getHTMLDescription(strNodeId);
        } catch (Exception e) {
            e.printStackTrace();
        }

        out.println(description);
        out.close();
    }

}
