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

package org.openbravo.dal.xml;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.dom4j.Document;
import org.dom4j.Element;
import org.openbravo.base.model.Entity;
import org.openbravo.base.model.ModelProvider;
import org.openbravo.base.model.Property;
import org.openbravo.base.provider.OBProvider;
import org.openbravo.base.provider.OBSingleton;

/**
 * Converts one or more business objects to a XML presentation.
 * 
 * TODO: Support id's with multiple values
 * 
 * @author mtaal
 */

public class ModelXMLConverter implements OBSingleton {
    // private static final Logger log =
    // Logger.getLogger(DalToXMLConverter.class);

    private static ModelXMLConverter instance = new ModelXMLConverter();

    public static ModelXMLConverter getInstance() {
        if (instance == null) {
            instance = OBProvider.getInstance().get(ModelXMLConverter.class);
        }
        return instance;
    }

    public Document getTypesAsXML() {
        final Document doc = XMLUtil.getInstance().createDomDocument();
        final Element root = doc.addElement("Types");
        final List<String> entityNames = new ArrayList<String>();
        for (final Entity e : ModelProvider.getInstance().getModel()) {
            entityNames.add(e.getName());
        }
        Collections.sort(entityNames);

        for (final String entityName : entityNames) {
            final Element typeElement = root.addElement("Type");
            typeElement.addAttribute("entityName", entityName);
        }
        return doc;
    }

    // Generates the schema, if the
    public Document getSchema() {
        final Document doc = XMLUtil.getInstance().createDomDocument();
        final Element root = doc.addElement("schema");
        root.addAttribute("xmlns", "http://www.w3.org/1999/XMLSchema");
        root.addAttribute("xmlns:bo", "http://www.openbravo.com");

        final List<String> entityNames = new ArrayList<String>();
        for (final Entity e : ModelProvider.getInstance().getModel()) {
            entityNames.add(e.getName());
        }
        Collections.sort(entityNames);

        final Element rootElement = root.addElement("element");
        rootElement.addAttribute("name", XMLConstants.OB_ROOT_ELEMENT);
        final Element complexType = rootElement.addElement("complexType");
        final Element choiceElement = complexType.addElement("choice");
        choiceElement.addAttribute("minOccurs", "1");
        choiceElement.addAttribute("maxOccurs", "unbounded");

        rootElement.addElement("attribute").addAttribute("name",
                XMLConstants.DATE_TIME_ATTRIBUTE)
                .addAttribute("type", "string").addAttribute("use", "optional");
        rootElement.addElement("attribute").addAttribute("name",
                XMLConstants.OB_VERSION_ATTRIBUTE).addAttribute("type",
                "string").addAttribute("use", "optional");
        rootElement.addElement("attribute").addAttribute("name",
                XMLConstants.OB_REVISION_ATTRIBUTE).addAttribute("type",
                "string").addAttribute("use", "optional");

        for (final String entityName : entityNames) {
            final Element entityElement = choiceElement.addElement("element");
            entityElement.addAttribute("name", entityName);
            entityElement.addAttribute("type", "ob:" + entityName + "Type");
        }

        for (final String entityName : entityNames) {
            final Element typeElement = root.addElement("complexType");
            typeElement.addAttribute("name", entityName + "Type");

            final Element typeSequenceElement = typeElement
                    .addElement("sequence");
            typeSequenceElement.addAttribute("minOccurs", "0");

            addPropertyElements(typeSequenceElement, ModelProvider
                    .getInstance().getEntity(entityName));

            typeElement.addElement("attribute").addAttribute("name", "id")
                    .addAttribute("type", "string").addAttribute("use",
                            "optional");
            typeElement.addElement("attribute").addAttribute("name",
                    "identifier").addAttribute("type", "string").addAttribute(
                    "use", "optional");
            typeElement.addElement("anyAttribute");
        }

        return doc;
    }

    protected void addPropertyElements(Element sequence, Entity e) {
        for (final Property p : e.getProperties()) {
            final Element element = sequence.addElement("element");

            element.addAttribute("name", p.getName());

            if (p.isOneToMany()) {
                element.addAttribute("minOccurs", "0");
            } else {
                if ((p.isPrimitive() && p.isId()) || !p.isMandatory()) {
                    element.addAttribute("minOccurs", "0");
                } else if (p.isMandatory()) {
                    element.addAttribute("minOccurs", "1");
                }
                element.addAttribute("nillable", Boolean.toString(!p
                        .isMandatory()));
            }

            // set the type
            if (p.isPrimitive()) {
                element.addAttribute("type", XMLTypeConverter.getInstance()
                        .toXMLSchemaType(p.getPrimitiveType()));
            } else if (p.isOneToMany()) {
                final Element complexChildElement = element
                        .addElement("complexType");
                final Element sequenceChildElement = complexChildElement
                        .addElement("sequence");
                final Element childElement = sequenceChildElement
                        .addElement("element");

                childElement
                        .addAttribute("name", p.getTargetEntity().getName());
                childElement.addAttribute("type", "ob:"
                        + p.getTargetEntity().getName() + "Type");
                childElement.addAttribute("minOccurs", "0");
                childElement.addAttribute("maxOccurs", "unbounded");
            } else {
                addReferenceAttributes(element);
            }
        }
    }

    protected void addReferenceAttributes(Element elem) {
        elem.addElement("attribute").addAttribute("name", "id").addAttribute(
                "type", "string").addAttribute("use", "optional");
        elem.addElement("attribute").addAttribute("name", "entityName")
                .addAttribute("type", "string").addAttribute("use", "optional");
        elem.addElement("attribute").addAttribute("name", "identifier")
                .addAttribute("type", "string").addAttribute("use", "optional");
    }

}