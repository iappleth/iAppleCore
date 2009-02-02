/*
 ************************************************************************************
 * Copyright (C) 2001-2006 Openbravo S.L.
 * Licensed under the Apache Software License version 2.0
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to  in writing,  software  distributed
 * under the License is distributed  on  an  "AS IS"  BASIS,  WITHOUT  WARRANTIES  OR
 * CONDITIONS OF ANY KIND, either  express  or  implied.  See  the  License  for  the
 * specific language governing permissions and limitations under the License.
 ************************************************************************************
 */
package org.openbravo.xmlEngine;

import java.util.Vector;

import org.apache.log4j.Logger;

class LabelTemplate implements XmlComponentTemplate, IDComponent {

  static Logger log4j = Logger.getLogger(LabelTemplate.class);

  String strName = null;
  String strReplace = null;
  int type = LABEL;
  // String strDefault = null;
  // String section = null;
  XmlComponentTemplate xmlComponentTemplate = null;
  Vector<ReplaceElement> vecReplace = null;

  public int type() {
    return type;
  }

  public LabelValue createLabelValue(XmlDocument xmlDocument) {
    log4j.debug("running createLabelValue() method - hasLabelValue: "
        + xmlDocument.hasLabelValue.size());
    LabelValue labelValue = xmlDocument.hasLabelValue.get(strName);
    // log4j.debug("running createLabelValue() method - labelValue: " +
    // labelValue.labelTemplate.strName);
    if (labelValue == null)
      labelValue = new LabelValue(this, xmlDocument);
    return labelValue;
  }

  public XmlComponentValue createXmlComponentValue(XmlDocument xmlDocument) {
    log4j.debug("createXmlComponentValue with xmlDocument hasLabelSize: " + xmlDocument.toString());
    return createLabelValue(xmlDocument);
  }

}
