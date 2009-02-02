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

import org.apache.log4j.Logger;

class FunctionSubtractValue extends FunctionEvaluationValue {

  static Logger log4jFunctionSubtractValue = Logger.getLogger(FunctionSubtractValue.class);

  public FunctionSubtractValue(FunctionTemplate functionTemplate, XmlDocument xmlDocument) {
    super(functionTemplate, xmlDocument);
  }

  public String print() {
    if (arg1Value.print().equals(XmlEngine.strTextDividedByZero)
        || arg2Value.print().equals(XmlEngine.strTextDividedByZero)) {
      return XmlEngine.strTextDividedByZero;
    } else {
      return functionTemplate.printFormatOutput(Double.valueOf(arg1Value.printSimple())
          .doubleValue()
          - Double.valueOf(arg2Value.printSimple()).doubleValue());
    }
  }

  public String printSimple() {
    if (arg1Value.print().equals(XmlEngine.strTextDividedByZero)
        || arg2Value.print().equals(XmlEngine.strTextDividedByZero)) {
      return XmlEngine.strTextDividedByZero;
    } else {
      return functionTemplate.printFormatSimple(Double.valueOf(arg1Value.printSimple())
          .doubleValue()
          - Double.valueOf(arg2Value.printSimple()).doubleValue());
    }
  }

}
