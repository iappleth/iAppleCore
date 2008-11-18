/*
 * 
 * Copyright (C) 2001-2008 Openbravo S.L. Licensed under the Apache Software
 * License version 2.0 You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0 Unless required by applicable law
 * or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
package org.openbravo.base.util;

import org.openbravo.base.exception.OBException;

/**
 * Exception which can be used to indicate that arguments of a method have
 * illegal values. Is an unchecked exception which also logs itself.
 * 
 * @author mtaal
 */
public class ArgumentException extends OBException {

    private static final long serialVersionUID = 1L;

    public ArgumentException() {
        super();
    }

    public ArgumentException(String message, Throwable cause) {
        super(message, cause);
    }

    public ArgumentException(String message) {
        super(message);
    }

    public ArgumentException(Throwable cause) {
        super(cause);
    }
}
