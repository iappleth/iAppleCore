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

package org.openbravo.test.xml;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.StringReader;
import java.net.URI;
import java.net.URL;

import org.openbravo.base.exception.OBException;
import org.openbravo.dal.service.OBCriteria;
import org.openbravo.dal.service.OBDal;
import org.openbravo.model.ad.utility.ReferenceDataStore;
import org.openbravo.test.base.BaseTest;

/**
 * Supports testing of xml imports/export.
 * 
 * @author mtaal
 */

public class XMLBaseTest extends BaseTest {

    protected void compare(String result, String file) {
        try {
            final URL url = this.getClass().getResource("testdata/" + file);
            final File f = new File(new URI(url.toString()));
            final BufferedReader r1 = new BufferedReader(new FileReader(f));
            final BufferedReader r2 = new BufferedReader(new StringReader(
                    result));
            String line = null;
            int lineNo = 1;
            while ((line = r1.readLine()) != null) {
                final String otherLine = r2.readLine();
                assertTrue("File: " + file + ": Lines are unequal: \n" + line
                        + "\n" + otherLine + "\n Line number is " + lineNo,
                        line.equals(otherLine));
                lineNo++;
            }
        } catch (final Exception e) {
            throw new OBException(e);
        }
    }

    protected String getFileContent(String file) {
        try {
            final URL url = this.getClass().getResource("testdata/" + file);
            final File f = new File(new URI(url.toString()));
            final BufferedReader r1 = new BufferedReader(new FileReader(f));
            final StringBuilder sb = new StringBuilder();
            String line;
            while ((line = r1.readLine()) != null) {
                if (sb.length() > 0) {
                    sb.append("\n");
                }
                sb.append(line);
            }
            return sb.toString();
        } catch (final Exception e) {
            throw new OBException(e);
        }
    }

    protected void cleanRefDataLoaded() {
        setUserContext("0");
        final OBCriteria<ReferenceDataStore> obc = OBDal.getInstance()
                .createCriteria(ReferenceDataStore.class);
        obc.setFilterOnActive(false);
        obc.setFilterOnReadableClients(false);
        obc.setFilterOnReadableOrganisation(false);
        for (final ReferenceDataStore rdl : obc.list()) {
            OBDal.getInstance().remove(rdl);
        }
        OBDal.getInstance().commitAndClose();
    }
}