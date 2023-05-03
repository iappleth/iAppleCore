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
 * All portions are Copyright (C) 2023 Openbravo SLU
 * All Rights Reserved.
 * Contributor(s):  ______________________________________.
 *************************************************************************
 */
package org.openbravo.client.application.attachment;

import org.openbravo.base.exception.OBException;

/**
 * Class used to indicate that the information of a ReprintableDocument could not be found by the
 * {@link ReprintableDocumentManager}
 */
@SuppressWarnings("serial")
public class DocumentNotFoundException extends OBException {

  /**
   * Constructs a new DocumentNotFoundException
   */
  public DocumentNotFoundException() {
    super();
  }

  /**
   * Constructs a new DocumentNotFoundException
   *
   * @param cause
   *          The original cause of the error
   */
  public DocumentNotFoundException(Throwable cause) {
    super(cause);
  }
}
